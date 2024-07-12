'use server'

import crypto from "node:crypto";
import { configureLemonSqueezy } from '@/config/lemonsqueezy'
import { createCheckout, getPrice, getProduct, getSubscription, lemonSqueezySetup, listPrices, listProducts, updateSubscription, type Variant } from '@lemonsqueezy/lemonsqueezy.js'
import {
    plans,
    subscriptions,
    webhookEvents,
    type NewPlan,
    type NewSubscription,
    type NewWebhookEvent,
  } from "@/lib/supabase/schema";
import db from '@/lib/supabase/db';
import createSupabaseServerClient from '@/lib/supabase/server';
import { eq } from 'drizzle-orm';
import { webhookHasData, webhookHasMeta } from "@/lib/typeguards";
import { revalidatePath } from "next/cache";
import { takeUniqueOrThrow } from "@/lib/utils";
import { notFound } from "next/navigation";


export async function syncPlans() {
  configureLemonSqueezy()

  // Fetch all the variants from the database.
  const productVariants: NewPlan[] = await db.select().from(plans)

  // Helper function to add a variant to the productVariants array and sync it with the database.
  async function _addVariant(variant: NewPlan) {
    // eslint-disable-next-line no-console -- allow
    console.log(`Syncing variant ${variant.name} with the database...`)

    // Sync the variant with the plan in the database.
    await db
      .insert(plans)
      .values(variant)
      .onConflictDoUpdate({ target: plans.variantId, set: variant })

    /* eslint-disable no-console -- allow */
    console.log(`${variant.name} synced with the database...`)

    productVariants.push(variant)
  }

  // Fetch products from the Lemon Squeezy store.
  const products = await listProducts({
    filter: { storeId: process.env.LEMONSQUEEZY_STORE_ID },
    include: ['variants'],
  })

  // Loop through all the variants.
  const allVariants = products.data?.included as Variant['data'][] | undefined

  // for...of supports asynchronous operations, unlike forEach.
  if (allVariants) {
    /* eslint-disable no-await-in-loop -- allow */
    for (const v of allVariants) {
      const variant = v.attributes

      // Skip draft variants or if there's more than one variant, skip the default
      // variant. See https://docs.lemonsqueezy.com/api/variants
      if (
        variant.status === 'draft' ||
        (allVariants.length !== 1 && variant.status === 'pending')
      ) {
        // `return` exits the function entirely, not just the current iteration.
        // so use `continue` instead.
        continue
      }

      // Fetch the Product name.
      const productName =
        (await getProduct(variant.product_id)).data?.data.attributes.name ?? ''

      // Fetch the Price object.
      const variantPriceObject = await listPrices({
        filter: {
          variantId: v.id,
        },
      })

      const currentPriceObj = variantPriceObject.data?.data.at(0)
      const isUsageBased =
        currentPriceObj?.attributes.usage_aggregation !== null
      const interval = currentPriceObj?.attributes.renewal_interval_unit
      const intervalCount =
        currentPriceObj?.attributes.renewal_interval_quantity
      const trialInterval = currentPriceObj?.attributes.trial_interval_unit
      const trialIntervalCount =
        currentPriceObj?.attributes.trial_interval_quantity

      const price = isUsageBased
        ? currentPriceObj?.attributes.unit_price_decimal
        : currentPriceObj.attributes.unit_price

      const priceString = price !== null ? price?.toString() ?? '' : ''

      const isSubscription =
        currentPriceObj?.attributes.category === 'subscription'

      // If not a subscription, skip it.
      if (!isSubscription) {
        continue
      }

      await _addVariant({
        name: variant.name,
        description: variant.description,
        price: priceString,
        interval,
        intervalCount,
        isUsageBased,
        productId: variant.product_id,
        productName,
        variantId: parseInt(v.id) as unknown as number,
        trialInterval,
        trialIntervalCount,
        sort: variant.sort,
      })
    }
  }

  return productVariants
}

/////////////////////////////////////////////

export async function getCheckoutURL(variantId: number, embed = false) {
  configureLemonSqueezy();

  const supabase = await createSupabaseServerClient();
  // const session = await supabase.auth.getUser();
  
const { data: { user } } = await supabase.auth.getUser();
console.log(user);
  if (!user) {console.log(user)
    throw new Error("User is not authenticated.");
  }

  // import { createCheckout } from '@lemonsqueezy/lemonsqueezy.js'
  const checkout = await createCheckout(
    process.env.LEMONSQUEEZY_STORE_ID!,
    variantId,
    {
      checkoutOptions: {
        embed,
        media: false,
        logo: !embed,
      },
      checkoutData: {
        email: user.email ?? undefined,
        custom: {
          user_id: user.id,
        },
      },
      productOptions: {
        enabledVariants: [variantId],
        redirectUrl: `${process.env.NEXT_PUBLIC_APP_URL}/billing/`,
        receiptButtonText: 'Go to Dashboard',
        receiptThankYouNote: 'Thank you for signing up to Lemon Stand!',
      },
    }
  )

  return checkout.data?.data.attributes.url
}



/**
 * This action will process a webhook event in the database.
 */
export async function processWebhookEvent(webhookEvent: NewWebhookEvent) {
  configureLemonSqueezy()

  const dbwebhookEvent = await db
    .select()
    .from(webhookEvents)
    .where(eq(webhookEvents.id, webhookEvent.id))

  if (dbwebhookEvent.length < 1) {
    throw new Error(
      `Webhook event #${webhookEvent.id} not found in the database.`
    )
  }

  if (!process.env.WEBHOOK_URL) {
    throw new Error(
      'Missing required WEBHOOK_URL env variable. Please, set it in your .env file.'
    )
  }

  let processingError = ''
  const eventBody = webhookEvent.body

  if (!webhookHasMeta(eventBody)) {
    processingError = "Event body is missing the 'meta' property."
  } else if (webhookHasData(eventBody)) {
    if (webhookEvent.eventName.startsWith('subscription_payment_')) {
      // Save subscription invoices; eventBody is a SubscriptionInvoice
      // Not implemented.
    } else if (webhookEvent.eventName.startsWith('subscription_')) {
      // Save subscription events; obj is a Subscription
      const attributes = eventBody.data.attributes
      const variantId = attributes.variant_id as string

      // We assume that the Plan table is up to date.
      const plan = await db
        .select()
        .from(plans)
        .where(eq(plans.variantId, parseInt(variantId, 10)))

      if (plan.length < 1) {
        processingError = `Plan with variantId ${variantId} not found.`
      } else {
        // Update the subscription in the database.

        const priceId = attributes.first_subscription_item.price_id

        // Get the price data from Lemon Squeezy.
        const priceData = await getPrice(priceId)
        if (priceData.error) {
          processingError = `Failed to get the price data for the subscription ${eventBody.data.id}.`
        }

        const isUsageBased = attributes.first_subscription_item.is_usage_based
        const price = isUsageBased
          ? priceData.data?.data.attributes.unit_price_decimal
          : priceData.data?.data.attributes.unit_price

        const updateData: NewSubscription = {
          lemonSqueezyId: eventBody.data.id,
          orderId: attributes.order_id as number,
          name: attributes.user_name as string,
          email: attributes.user_email as string,
          status: attributes.status as string,
          statusFormatted: attributes.status_formatted as string,
          renewsAt: attributes.renews_at as string,
          endsAt: attributes.ends_at as string,
          trialEndsAt: attributes.trial_ends_at as string,
          price: price?.toString() ?? '',
          isPaused: false,
          subscriptionItemId: attributes.first_subscription_item.id,
          isUsageBased: attributes.first_subscription_item.is_usage_based,
          userId: eventBody.meta.custom_data.user_id,
          planId: plan[0].id,
        }

        // Create/update subscription in the database.
        try {
          await db.insert(subscriptions).values(updateData).onConflictDoUpdate({
            target: subscriptions.lemonSqueezyId,
            set: updateData,
          })
        } catch (error) {
          processingError = `Failed to upsert Subscription #${updateData.lemonSqueezyId} to the database.`
          console.error(error)
        }
      }
    } else if (webhookEvent.eventName.startsWith('order_')) {
      // Save orders; eventBody is a "Order"
      /* Not implemented */
    } else if (webhookEvent.eventName.startsWith('license_')) {
      // Save license keys; eventBody is a "License key"
      /* Not implemented */
    }

    // Update the webhook event in the database.
    await db
      .update(webhookEvents)
      .set({
        processed: true,
        processingError,
      })
      .where(eq(webhookEvents.id, webhookEvent.id))
  }
}

  export async function storeWebhookEvent(
    eventName: string,
    body: NewWebhookEvent["body"],
  ) {
    if (!process.env.POSTGRES_URL) {
      throw new Error("POSTGRES_URL is not set");
    }
  
    const id = crypto.randomInt(100000000, 1000000000);
  
    const returnedValue = await db
      .insert(webhookEvents)
      .values({
        id,
        eventName,
        processed: false,
        body,
      })
      .onConflictDoNothing({ target: plans.id })
      .returning();
  
    return returnedValue[0];
  }

  

  export async function getUserSubscriptions() {
    // const session = await auth();
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser()
    const userId = user?.id;
  
    if (!userId) {
      notFound();
    }
  
    const userSubscriptions: NewSubscription[] = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.userId, userId));
  
    return userSubscriptions;
  }

  export async function changePlan(currentPlanId: number, newPlanId: number) {
    configureLemonSqueezy();
  
    // Get user subscriptions
    const userSubscriptions = await getUserSubscriptions();
  
    // Check if the subscription exists
    const subscription = userSubscriptions.find(
      (sub) => sub.planId === currentPlanId,
    );
  
    if (!subscription) {
      throw new Error(
        `No subscription with plan id #${currentPlanId} was found.`,
      );
    }
  
    // Get the new plan details from the database.
    const newPlan = await db
      .select()
      .from(plans)
      .where(eq(plans.id, newPlanId))
      .then(takeUniqueOrThrow);
  
    // Send request to Lemon Squeezy to change the subscription.
    const updatedSub = await updateSubscription(subscription.lemonSqueezyId, {
      variantId: newPlan.variantId,
    });
  
    // Save in db
    try {
      await db
        .update(subscriptions)
        .set({
          planId: newPlanId,
          price: newPlan.price,
          endsAt: updatedSub.data?.data.attributes.ends_at,
        })
        .where(eq(subscriptions.lemonSqueezyId, subscription.lemonSqueezyId));
    } catch (error) {
      throw new Error(
        `Failed to update Subscription #${subscription.lemonSqueezyId} in the database.`,
      );
    }
  
    revalidatePath("/");
  
    return updatedSub;
  }


  export async function getSubscriptionURLs(id: string) {
    configureLemonSqueezy();
    const subscription = await getSubscription(id);
  
    if (subscription.error) {
      throw new Error(subscription.error.message);
    }
  
    return subscription.data?.data.attributes.urls;
  }