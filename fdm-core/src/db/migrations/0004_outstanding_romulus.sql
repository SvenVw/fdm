ALTER TABLE "fdm-dev"."cultivation_harvesting" RENAME COLUMN "b_date_harvest" TO "b_harvest_date";--> statement-breakpoint
ALTER TABLE "fdm-dev"."cultivation_terminating" RENAME COLUMN "b_date_terminate" TO "b_terminate_date";--> statement-breakpoint
ALTER TABLE "fdm-dev"."harvestable_sampling" RENAME COLUMN "b_date_sampling" TO "b_sampling_date";