ALTER TABLE "fdm"."field_acquiring" ALTER COLUMN "b_acquiring_method" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "fdm"."field_acquiring" ALTER COLUMN "b_acquiring_method" SET DEFAULT 'unknown'::text;--> statement-breakpoint
DROP TYPE "fdm"."b_acquiring_method";--> statement-breakpoint
UPDATE "fdm"."field_acquiring" SET "b_acquiring_method" = 'nl_01' WHERE "b_acquiring_method" = 'owner';
UPDATE "fdm"."field_acquiring" SET "b_acquiring_method" = 'nl_02' WHERE "b_acquiring_method" = 'lease';
CREATE TYPE "fdm"."b_acquiring_method" AS ENUM('nl_01', 'nl_02', 'nl_07', 'nl_09', 'nl_12', 'nl_13', 'nl_61', 'nl_63', 'unknown');--> statement-breakpoint
ALTER TABLE "fdm"."field_acquiring" ALTER COLUMN "b_acquiring_method" SET DEFAULT 'unknown'::"fdm"."b_acquiring_method";--> statement-breakpoint
ALTER TABLE "fdm"."field_acquiring" ALTER COLUMN "b_acquiring_method" SET DATA TYPE "fdm"."b_acquiring_method" USING "b_acquiring_method"::"fdm"."b_acquiring_method";