CREATE TABLE IF NOT EXISTS "fdm-dev"."grants" (
	"b_farm_id" text NOT NULL,
	"user_id" text NOT NULL,
	"created" timestamp with time zone DEFAULT now() NOT NULL,
	"destroyed" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "fdm-dev"."session" (
	"session_id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"created" timestamp with time zone DEFAULT now() NOT NULL,
	"updated" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "fdm-dev"."users" (
	"user_id" text PRIMARY KEY NOT NULL,
	"firstname" text,
	"surname" text,
	"email" text,
	"created" timestamp with time zone DEFAULT now() NOT NULL,
	"updated" timestamp with time zone
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "fdm-dev"."grants" ADD CONSTRAINT "grants_b_farm_id_farms_b_id_farm_fk" FOREIGN KEY ("b_farm_id") REFERENCES "fdm-dev"."farms"("b_id_farm") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "fdm-dev"."grants" ADD CONSTRAINT "grants_user_id_users_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "fdm-dev"."users"("user_id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "fdm-dev"."session" ADD CONSTRAINT "session_user_id_users_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "fdm-dev"."users"("user_id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "session_id_idx" ON "fdm-dev"."session" USING btree ("session_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "user_id_idx" ON "fdm-dev"."users" USING btree ("user_id");