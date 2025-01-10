ALTER TABLE "fdm-dev"."farms" ADD COLUMN "b_businessid_farm" text;--> statement-breakpoint
ALTER TABLE "fdm-dev"."farms" ADD COLUMN "b_address_farm" text;--> statement-breakpoint
ALTER TABLE "fdm-dev"."farms" ADD COLUMN "b_postalcode_farm" text;--> statement-breakpoint
ALTER TABLE "fdm-dev"."farms" DROP COLUMN "b_sector";--> statement-breakpoint
DROP TYPE "fdm-dev"."b_sector";