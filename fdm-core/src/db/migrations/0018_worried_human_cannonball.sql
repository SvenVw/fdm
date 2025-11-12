CREATE TYPE "fdm"."b_lu_harvestcat" AS ENUM('HC010', 'HC020', 'HC031', 'HC040', 'HC041', 'HC042', 'HC050', 'HC061');--> statement-breakpoint
ALTER TABLE "fdm"."cultivations_catalogue" ADD COLUMN "b_lu_harvestcat" "fdm"."b_lu_harvestcat";--> statement-breakpoint
ALTER TABLE "fdm"."cultivations_catalogue" ADD COLUMN "b_lu_dm" numeric;--> statement-breakpoint
ALTER TABLE "fdm"."harvestable_analyses" ADD COLUMN "b_lu_yield_fresh" numeric;--> statement-breakpoint
ALTER TABLE "fdm"."harvestable_analyses" ADD COLUMN "b_lu_yield_bruto" numeric;--> statement-breakpoint
ALTER TABLE "fdm"."harvestable_analyses" ADD COLUMN "b_lu_tarra" numeric;--> statement-breakpoint
ALTER TABLE "fdm"."harvestable_analyses" ADD COLUMN "b_lu_dm" numeric;--> statement-breakpoint
ALTER TABLE "fdm"."harvestable_analyses" ADD COLUMN "b_lu_moist" numeric;--> statement-breakpoint
ALTER TABLE "fdm"."harvestable_analyses" ADD COLUMN "b_lu_uww" numeric;--> statement-breakpoint
ALTER TABLE "fdm"."harvestable_analyses" ADD COLUMN "b_lu_cp" numeric;--> statement-breakpoint
ALTER TABLE "fdm"."harvestable_analyses" ADD COLUMN "f_no3_td_asis" numeric;