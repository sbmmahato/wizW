'use client'

import { useRouter } from 'next/navigation'
import { Button, Loading } from '@lemonsqueezy/wedges'
import {
    forwardRef,
    useEffect,
    useState,
    type ComponentProps,
    type ElementRef,
  } from "react";
  import { toast } from "sonner";
import { type NewPlan } from '@/lib/supabase/schema'
import { getCheckoutURL } from "@/app/actions";
declare global {
  interface Window {
    createLemonSqueezy:any;
    LemonSqueezy:any;
  }
}

export function SignupButton(props: {
  plan: NewPlan
  currentPlan?: NewPlan
  embed?: boolean
}) {
  const { plan, currentPlan, embed = true } = props
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const isCurrent = plan.id === currentPlan?.id

  const label = isCurrent ? 'Your plan' : 'Sign up'

  // Make sure Lemon.js is loaded, you need to enqueue the Lemon Squeezy SDK in your app first.
  useEffect(() => {
    if (typeof window.createLemonSqueezy === 'function') {
      window.createLemonSqueezy()
    }
  }, [])

  // eslint-disable-next-line no-nested-ternary -- disabled
  const before:any = loading ? <Loading /> : null

  return (
    <Button
      before={before}
      disabled={loading || isCurrent}
      onClick={async () => {
        // Create a checkout and open the Lemon.js modal
        let checkoutUrl: string | undefined | void = ''; //

        try {
          setLoading(true)
          checkoutUrl = await getCheckoutURL(plan.variantId, embed)
        } catch (error) {
          setLoading(false)
          toast('Error creating a checkout.', {
            description:
              'Please check the server console for more information.',
          })
        } finally {
          embed && setLoading(false)
        }

        embed
          ? checkoutUrl && window.LemonSqueezy.Url.Open(checkoutUrl)
          : router.push(checkoutUrl ?? '/')
      }}
    >
      {label}
    </Button>
  )
}