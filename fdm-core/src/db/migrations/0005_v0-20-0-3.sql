CREATE TYPE "fdm"."b_lu_croprotation" AS ENUM('other', 'clover', 'nature', 'potato', 'grass', 'rapeseed', 'starch', 'maize', 'cereal', 'sugarbeet', 'alfalfa', 'catchcrop');--> statement-breakpoint
ALTER TABLE "fdm"."cultivation_ending" ADD COLUMN "m_cropresidue" boolean;--> statement-breakpoint
ALTER TABLE "fdm"."cultivations_catalogue" ADD COLUMN "b_lu_croprotation" "fdm"."b_lu_croprotation";--> statement-breakpoint
ALTER TABLE "fdm"."cultivations_catalogue" ADD COLUMN "b_lu_yield" numeric;--> statement-breakpoint
ALTER TABLE "fdm"."cultivations_catalogue" ADD COLUMN "b_lu_hi" numeric;--> statement-breakpoint
ALTER TABLE "fdm"."cultivations_catalogue" ADD COLUMN "b_lu_n_harvestable" numeric;--> statement-breakpoint
ALTER TABLE "fdm"."cultivations_catalogue" ADD COLUMN "b_lu_n_residue" numeric;--> statement-breakpoint
ALTER TABLE "fdm"."cultivations_catalogue" ADD COLUMN "b_n_fixation" numeric;--> statement-breakpoint
ALTER TABLE "fdm"."soil_analysis" ADD COLUMN "a_c_of" numeric;--> statement-breakpoint
ALTER TABLE "fdm"."soil_analysis" ADD COLUMN "a_cn_fr" numeric;--> statement-breakpoint
ALTER TABLE "fdm"."soil_analysis" ADD COLUMN "a_density_sa" numeric;--> statement-breakpoint
ALTER TABLE "fdm"."soil_analysis" ADD COLUMN "a_n_rt" numeric;