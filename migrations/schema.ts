import { pgTable, unique, pgEnum, serial, integer, text, boolean, timestamp, jsonb, foreignKey, uuid } from "drizzle-orm/pg-core"
  import { sql } from "drizzle-orm"

export const aal_level = pgEnum("aal_level", ['aal1', 'aal2', 'aal3'])
export const code_challenge_method = pgEnum("code_challenge_method", ['s256', 'plain'])
export const factor_status = pgEnum("factor_status", ['unverified', 'verified'])
export const factor_type = pgEnum("factor_type", ['totp', 'webauthn'])
export const one_time_token_type = pgEnum("one_time_token_type", ['confirmation_token', 'reauthentication_token', 'recovery_token', 'email_change_token_new', 'email_change_token_current', 'phone_change_token'])
export const key_status = pgEnum("key_status", ['default', 'valid', 'invalid', 'expired'])
export const key_type = pgEnum("key_type", ['aead-ietf', 'aead-det', 'hmacsha512', 'hmacsha256', 'auth', 'shorthash', 'generichash', 'kdf', 'secretbox', 'secretstream', 'stream_xchacha20'])
export const action = pgEnum("action", ['INSERT', 'UPDATE', 'DELETE', 'TRUNCATE', 'ERROR'])
export const equality_op = pgEnum("equality_op", ['eq', 'neq', 'lt', 'lte', 'gt', 'gte', 'in'])


export const plan = pgTable("plan", {
	id: serial("id").primaryKey().notNull(),
	productId: integer("productId").notNull(),
	productName: text("productName"),
	variantId: integer("variantId").notNull(),
	name: text("name").notNull(),
	description: text("description"),
	price: text("price").notNull(),
	isUsageBased: boolean("isUsageBased").default(false),
	interval: text("interval"),
	intervalCount: integer("intervalCount"),
	trialInterval: text("trialInterval"),
	trialIntervalCount: integer("trialIntervalCount"),
	sort: integer("sort"),
},
(table) => {
	return {
		plan_variantId_unique: unique("plan_variantId_unique").on(table.variantId),
	}
});

export const webhookEvent = pgTable("webhookEvent", {
	id: integer("id").primaryKey().notNull(),
	createdAt: timestamp("createdAt", { mode: 'string' }).defaultNow().notNull(),
	eventName: text("eventName").notNull(),
	processed: boolean("processed").default(false),
	body: jsonb("body").notNull(),
	processingError: text("processingError"),
});

export const users = pgTable("users", {
	id: uuid("id").primaryKey().notNull(),
	full_name: text("full_name"),
	avatar_url: text("avatar_url"),
	billing_address: jsonb("billing_address"),
	created_at: timestamp("created_at", { withTimezone: true, mode: 'string' }),
	payment_method: jsonb("payment_method"),
	email: text("email"),
},
(table) => {
	return {
		users_id_fkey: foreignKey({
			columns: [table.id],
			foreignColumns: [table.id],
			name: "users_id_fkey"
		}),
	}
});