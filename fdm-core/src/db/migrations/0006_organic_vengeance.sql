CREATE TYPE "fdm"."a_source" AS ENUM('nl-rva-l122', 'nl-rva-l136', 'nl-rva-l264', 'nl-rva-l320', 'nl-rva-l335', 'nl-rva-l610', 'nl-rva-l648', 'nl-rva-l697', 'nl-other-nmi', 'other');--> statement-breakpoint
UPDATE "fdm"."soil_analysis" SET "a_source" = 'nl-other-nmi' WHERE "a_source" = 'NMI'; --> statement-breakpoint
UPDATE "fdm"."soil_analysis" SET "a_source" = 'other' WHERE "a_source" != 'nl-other-nmi'; --> statement-breakpoint
ALTER TABLE "fdm"."soil_sampling" RENAME COLUMN "b_depth" TO "a_depth_lower";--> statement-breakpoint
ALTER TABLE "fdm"."soil_analysis" ALTER COLUMN "a_source" SET DEFAULT 'other'::"fdm"."a_source";--> statement-breakpoint
ALTER TABLE "fdm"."soil_analysis" ALTER COLUMN "a_source" SET DATA TYPE "fdm"."a_source" USING "a_source"::"fdm"."a_source";--> statement-breakpoint
ALTER TABLE "fdm"."soil_analysis" ADD COLUMN "a_al_ox" numeric;--> statement-breakpoint
ALTER TABLE "fdm"."soil_analysis" ADD COLUMN "a_ca_co" numeric;--> statement-breakpoint
ALTER TABLE "fdm"."soil_analysis" ADD COLUMN "a_ca_co_po" numeric;--> statement-breakpoint
ALTER TABLE "fdm"."soil_analysis" ADD COLUMN "a_caco3_if" numeric;--> statement-breakpoint
ALTER TABLE "fdm"."soil_analysis" ADD COLUMN "a_cec_co" numeric;--> statement-breakpoint
ALTER TABLE "fdm"."soil_analysis" ADD COLUMN "a_clay_mi" numeric;--> statement-breakpoint
ALTER TABLE "fdm"."soil_analysis" ADD COLUMN "a_com_fr" numeric;--> statement-breakpoint
ALTER TABLE "fdm"."soil_analysis" ADD COLUMN "a_cu_cc" numeric;--> statement-breakpoint
ALTER TABLE "fdm"."soil_analysis" ADD COLUMN "a_fe_ox" numeric;--> statement-breakpoint
ALTER TABLE "fdm"."soil_analysis" ADD COLUMN "a_k_cc" numeric;--> statement-breakpoint
ALTER TABLE "fdm"."soil_analysis" ADD COLUMN "a_k_co" numeric;--> statement-breakpoint
ALTER TABLE "fdm"."soil_analysis" ADD COLUMN "a_k_co_po" numeric;--> statement-breakpoint
ALTER TABLE "fdm"."soil_analysis" ADD COLUMN "a_mg_cc" numeric;--> statement-breakpoint
ALTER TABLE "fdm"."soil_analysis" ADD COLUMN "a_mg_co" numeric;--> statement-breakpoint
ALTER TABLE "fdm"."soil_analysis" ADD COLUMN "a_mg_co_po" numeric;--> statement-breakpoint
ALTER TABLE "fdm"."soil_analysis" ADD COLUMN "a_n_pmn" numeric;--> statement-breakpoint
ALTER TABLE "fdm"."soil_analysis" ADD COLUMN "a_nh4_cc" numeric;--> statement-breakpoint
ALTER TABLE "fdm"."soil_analysis" ADD COLUMN "a_nmin_cc" numeric;--> statement-breakpoint
ALTER TABLE "fdm"."soil_analysis" ADD COLUMN "a_no3_cc" numeric;--> statement-breakpoint
ALTER TABLE "fdm"."soil_analysis" ADD COLUMN "a_p_ox" numeric;--> statement-breakpoint
ALTER TABLE "fdm"."soil_analysis" ADD COLUMN "a_p_rt" numeric;--> statement-breakpoint
ALTER TABLE "fdm"."soil_analysis" ADD COLUMN "a_p_sg" numeric;--> statement-breakpoint
ALTER TABLE "fdm"."soil_analysis" ADD COLUMN "a_p_wa" numeric;--> statement-breakpoint
ALTER TABLE "fdm"."soil_analysis" ADD COLUMN "a_ph_cc" numeric;--> statement-breakpoint
ALTER TABLE "fdm"."soil_analysis" ADD COLUMN "a_s_rt" numeric;--> statement-breakpoint
ALTER TABLE "fdm"."soil_analysis" ADD COLUMN "a_sand_mi" numeric;--> statement-breakpoint
ALTER TABLE "fdm"."soil_analysis" ADD COLUMN "a_silt_mi" numeric;--> statement-breakpoint
ALTER TABLE "fdm"."soil_analysis" ADD COLUMN "a_zn_cc" numeric;--> statement-breakpoint
ALTER TABLE "fdm"."soil_sampling" ADD COLUMN "a_depth_upper" numeric DEFAULT 0 NOT NULL;