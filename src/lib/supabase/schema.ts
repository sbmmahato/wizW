import { boolean, integer, jsonb, pgTable, serial, text, timestamp, uuid } from "drizzle-orm/pg-core";
// import { prices, subscription_status, users } from "../../../migrations/schema";
import { sql } from "drizzle-orm";
import { users } from "../../../migrations/schema";

// export const subscriptions = pgTable("subscriptions", {
// 	id: text("id").primaryKey().notNull(),
// 	user_id: uuid("user_id").notNull().references(() => users.id),
// 	status: subscription_status("status"),
// 	metadata: jsonb("metadata"),
// 	price_id: text("price_id").references(() => prices.id),
// 	quantity: integer("quantity"),
// 	cancel_at_period_end: boolean("cancel_at_period_end"),
// 	created: timestamp("created", { withTimezone: true, mode: 'string' }).default(sql`now()`).notNull(),
// 	current_period_start: timestamp("current_period_start", { withTimezone: true, mode: 'string' }).default(sql`now()`).notNull(),
// 	current_period_end: timestamp("current_period_end", { withTimezone: true, mode: 'string' }).default(sql`now()`).notNull(),
// 	ended_at: timestamp("ended_at", { withTimezone: true, mode: 'string' }).default(sql`now()`),
// 	cancel_at: timestamp("cancel_at", { withTimezone: true, mode: 'string' }).default(sql`now()`),
// 	canceled_at: timestamp("canceled_at", { withTimezone: true, mode: 'string' }).default(sql`now()`),
// 	trial_start: timestamp("trial_start", { withTimezone: true, mode: 'string' }).default(sql`now()`),
// 	trial_end: timestamp("trial_end", { withTimezone: true, mode: 'string' }).default(sql`now()`),
// });


export const plans = pgTable('plan', {
	id: serial('id').primaryKey(),
	productId: integer('productId').notNull(),
	productName: text('productName'),
	variantId: integer('variantId').notNull().unique(),
	name: text('name').notNull(),
	description: text('description'),
	price: text('price').notNull(),
	isUsageBased: boolean('isUsageBased').default(false),
	interval: text('interval'),
	intervalCount: integer('intervalCount'),
	trialInterval: text('trialInterval'),
	trialIntervalCount: integer('trialIntervalCount'),
	sort: integer('sort'),
  })

  export const webhookEvents = pgTable('webhookEvent', {
	id: uuid('id').primaryKey(),
	createdAt: timestamp('createdAt', { mode: 'date' }).notNull().defaultNow(),
	eventName: text('eventName').notNull(),
	processed: boolean('processed').default(false),
	body: jsonb('body').notNull(),
	processingError: text('processingError'),
  })

  export const subscriptions = pgTable('subscription', {
	id: serial('id').primaryKey(),
	lemonSqueezyId: text('lemonSqueezyId').unique().notNull(),
	orderId: integer('orderId').notNull(),
	name: text('name').notNull(),
	email: text('email').notNull(),
	status: text('status').notNull(),
	statusFormatted: text('statusFormatted').notNull(),
	renewsAt: text('renewsAt'),
	endsAt: text('endsAt'),
	trialEndsAt: text('trialEndsAt'),
	price: text('price').notNull(),
	isUsageBased: boolean('isUsageBased').default(false),
	isPaused: boolean('isPaused').default(false),
	subscriptionItemId: serial('subscriptionItemId'),
	userId: uuid('userId')
	  .notNull()
	  .references(() => users.id),
	planId: integer('planId')
	  .notNull()
	  .references(() => plans.id),
  })


  export type NewPlan = typeof plans.$inferInsert;
  export type NewWebhookEvent = typeof webhookEvents.$inferInsert;
  export type NewSubscription = typeof subscriptions.$inferInsert;