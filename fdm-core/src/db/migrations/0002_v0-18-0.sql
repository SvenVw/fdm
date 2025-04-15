ALTER TABLE "fdm"."fertilizers_catalogue" RENAME COLUMN "p_cl_cr" TO "p_cl_rt";--> statement-breakpoint
ALTER TABLE "fdm"."fertilizers_catalogue" ALTER COLUMN "p_name_nl" SET NOT NULL;