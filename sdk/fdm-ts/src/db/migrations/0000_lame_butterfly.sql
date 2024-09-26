CREATE SCHEMA "fdm-dev";
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "fdm-dev"."b_manage_type" AS ENUM('owner', 'lease');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "fdm-dev"."sector" AS ENUM('diary', 'arable', 'tree_nursery', 'bulbs');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "fdm-dev"."farm_managing" (
	"b_id" text NOT NULL,
	"b_id_farm" text NOT NULL,
	"b_manage_start" date,
	"b_manage_end" date,
	"b_manage_type" "fdm-dev"."b_manage_type"
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "fdm-dev"."farms" (
	"b_id_farm" text PRIMARY KEY NOT NULL,
	"b_name_farm" text,
	"b_sector" "fdm-dev"."sector"
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "fdm-dev"."fields" (
	"b_id" text PRIMARY KEY NOT NULL,
	"b_name_field" text
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "fdm-dev"."farm_managing" ADD CONSTRAINT "farm_managing_b_id_fields_b_id_fk" FOREIGN KEY ("b_id") REFERENCES "fdm-dev"."fields"("b_id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "fdm-dev"."farm_managing" ADD CONSTRAINT "farm_managing_b_id_farm_farms_b_id_farm_fk" FOREIGN KEY ("b_id_farm") REFERENCES "fdm-dev"."farms"("b_id_farm") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
