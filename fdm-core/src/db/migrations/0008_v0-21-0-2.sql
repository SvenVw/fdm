ALTER TYPE "fdm"."p_app_method" ADD VALUE 'incorporation 2 tracks' BEFORE 'injection';--> statement-breakpoint
ALTER TYPE "fdm"."p_app_method" ADD VALUE 'shallow injection' BEFORE 'spraying';--> statement-breakpoint
ALTER TYPE "fdm"."p_app_method" ADD VALUE 'narrowband';--> statement-breakpoint
ALTER TABLE "fdm"."fertilizers_catalogue" ADD COLUMN "p_no3_rt" numeric;--> statement-breakpoint
ALTER TABLE "fdm"."fertilizers_catalogue" ADD COLUMN "p_nh4_rt" numeric;--> statement-breakpoint
ALTER TABLE "fdm"."fertilizers_catalogue" ADD COLUMN "p_ef_nh3" numeric;