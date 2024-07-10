CREATE TABLE IF NOT EXISTS "subscription" (
	"id" serial PRIMARY KEY NOT NULL,
	"lemonSqueezyId" text NOT NULL,
	"orderId" integer NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"status" text NOT NULL,
	"statusFormatted" text NOT NULL,
	"renewsAt" text,
	"endsAt" text,
	"trialEndsAt" text,
	"price" text NOT NULL,
	"isUsageBased" boolean DEFAULT false,
	"isPaused" boolean DEFAULT false,
	"subscriptionItemId" serial NOT NULL,
	"userId" uuid NOT NULL,
	"planId" integer NOT NULL,
	CONSTRAINT "subscription_lemonSqueezyId_unique" UNIQUE("lemonSqueezyId")
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "subscription" ADD CONSTRAINT "subscription_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "subscription" ADD CONSTRAINT "subscription_planId_plan_id_fk" FOREIGN KEY ("planId") REFERENCES "public"."plan"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
