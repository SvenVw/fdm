ALTER TABLE "fdm-dev"."farm_managing" ALTER COLUMN "b_manage_type" SET DEFAULT 'unknown';--> statement-breakpoint
ALTER TABLE "fdm-dev"."farm_managing" ALTER COLUMN "b_manage_type" SET NOT NULL;