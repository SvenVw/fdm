CREATE SCHEMA "fdm-dev";
--> statement-breakpoint
CREATE TYPE "fdm-dev"."p_app_method" AS ENUM('slotted coulter', 'incorporation', 'injection', 'spraying', 'broadcasting', 'spoke wheel', 'pocket placement');--> statement-breakpoint
CREATE TYPE "fdm-dev"."b_gwl_class" AS ENUM('II', 'IV', 'IIIb', 'V', 'VI', 'VII', 'Vb', '-|', 'Va', 'III', 'VIII', 'sVI', 'I', 'IIb', 'sVII', 'IVu', 'bVII', 'sV', 'sVb', 'bVI', 'IIIa');--> statement-breakpoint
CREATE TYPE "fdm-dev"."b_manage_type" AS ENUM('owner', 'lease');--> statement-breakpoint
CREATE TYPE "fdm-dev"."b_sector" AS ENUM('diary', 'arable', 'tree_nursery', 'bulbs');--> statement-breakpoint
CREATE TYPE "fdm-dev"."b_soiltype_agr" AS ENUM('moerige_klei', 'rivierklei', 'dekzand', 'zeeklei', 'dalgrond', 'veen', 'loess', 'duinzand', 'maasklei');--> statement-breakpoint
CREATE TABLE "fdm-dev"."cultivations" (
	"b_lu" text PRIMARY KEY NOT NULL,
	"b_lu_catalogue" text NOT NULL,
	"created" timestamp with time zone DEFAULT now() NOT NULL,
	"updated" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "fdm-dev"."cultivations_catalogue" (
	"b_lu_catalogue" text PRIMARY KEY NOT NULL,
	"b_lu_source" text NOT NULL,
	"b_lu_name" text NOT NULL,
	"b_lu_name_en" text,
	"b_lu_hcat3" text,
	"b_lu_hcat3_name" text,
	"created" timestamp with time zone DEFAULT now() NOT NULL,
	"updated" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "fdm-dev"."farm_managing" (
	"b_id" text NOT NULL,
	"b_id_farm" text NOT NULL,
	"b_manage_start" date,
	"b_manage_end" date,
	"b_manage_type" "fdm-dev"."b_manage_type",
	"created" timestamp with time zone DEFAULT now() NOT NULL,
	"updated" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "fdm-dev"."farms" (
	"b_id_farm" text PRIMARY KEY NOT NULL,
	"b_name_farm" text,
	"b_sector" "fdm-dev"."b_sector",
	"created" timestamp with time zone DEFAULT now() NOT NULL,
	"updated" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "fdm-dev"."fertilizer_acquiring" (
	"b_id_farm" text NOT NULL,
	"p_id" text NOT NULL,
	"p_acquiring_amount" numeric,
	"p_acquiring_date" timestamp with time zone,
	"created" timestamp with time zone DEFAULT now() NOT NULL,
	"updated" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "fdm-dev"."fertilizer_applying" (
	"p_app_id" text PRIMARY KEY NOT NULL,
	"b_id" text NOT NULL,
	"p_id" text NOT NULL,
	"p_app_amount" numeric,
	"p_app_method" "fdm-dev"."p_app_method",
	"p_app_date" timestamp with time zone,
	"created" timestamp with time zone DEFAULT now() NOT NULL,
	"updated" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "fdm-dev"."fertilizer_picking" (
	"p_id" text NOT NULL,
	"p_id_catalogue" text NOT NULL,
	"p_picking_date" timestamp with time zone,
	"created" timestamp with time zone DEFAULT now() NOT NULL,
	"updated" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "fdm-dev"."fertilizers" (
	"p_id" text PRIMARY KEY NOT NULL,
	"created" timestamp with time zone DEFAULT now() NOT NULL,
	"updated" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "fdm-dev"."fertilizers_catalogue" (
	"p_id_catalogue" text PRIMARY KEY NOT NULL,
	"p_source" text NOT NULL,
	"p_name_nl" text,
	"p_name_en" text,
	"p_description" text,
	"p_dm" numeric,
	"p_density" numeric,
	"p_om" numeric,
	"p_a" numeric,
	"p_hc" numeric,
	"p_eom" numeric,
	"p_eoc" numeric,
	"p_c_rt" numeric,
	"p_c_of" numeric,
	"p_c_if" numeric,
	"p_c_fr" numeric,
	"p_cn_of" numeric,
	"p_n_rt" numeric,
	"p_n_if" numeric,
	"p_n_of" numeric,
	"p_n_wc" numeric,
	"p_p_rt" numeric,
	"p_k_rt" numeric,
	"p_mg_rt" numeric,
	"p_ca_rt" numeric,
	"p_ne" numeric,
	"p_s_rt" numeric,
	"p_s_wc" numeric,
	"p_cu_rt" numeric,
	"p_zn_rt" numeric,
	"p_na_rt" numeric,
	"p_si_rt" numeric,
	"p_b_rt" numeric,
	"p_mn_rt" numeric,
	"p_ni_rt" numeric,
	"p_fe_rt" numeric,
	"p_mo_rt" numeric,
	"p_co_rt" numeric,
	"p_as_rt" numeric,
	"p_cd_rt" numeric,
	"p_cr_rt" numeric,
	"p_cr_vi" numeric,
	"p_pb_rt" numeric,
	"p_hg_rt" numeric,
	"p_cl_cr" numeric,
	"p_type_manure" boolean,
	"p_type_mineral" boolean,
	"p_type_compost" boolean,
	"created" timestamp with time zone DEFAULT now() NOT NULL,
	"updated" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "fdm-dev"."field_sowing" (
	"b_id" text NOT NULL,
	"b_lu" text NOT NULL,
	"b_sowing_date" timestamp with time zone,
	"b_sowing_amount" numeric,
	"b_sowing_method" text,
	"created" timestamp with time zone DEFAULT now() NOT NULL,
	"updated" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "fdm-dev"."fields" (
	"b_id" text PRIMARY KEY NOT NULL,
	"b_name" text,
	"b_geometry" geometry(polygon),
	"b_id_source" text,
	"created" timestamp with time zone DEFAULT now() NOT NULL,
	"updated" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "fdm-dev"."soil_analysis" (
	"a_id" text PRIMARY KEY NOT NULL,
	"a_date" timestamp with time zone,
	"a_source" text,
	"a_p_al" numeric,
	"a_p_cc" numeric,
	"a_som_loi" numeric,
	"b_gwl_class" "fdm-dev"."b_gwl_class",
	"b_soiltype_agr" "fdm-dev"."b_soiltype_agr",
	"created" timestamp with time zone DEFAULT now() NOT NULL,
	"updated" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "fdm-dev"."soil_sampling" (
	"b_id_sampling" text PRIMARY KEY NOT NULL,
	"b_id" text NOT NULL,
	"a_id" text NOT NULL,
	"b_depth" numeric,
	"b_sampling_date" timestamp with time zone,
	"created" timestamp with time zone DEFAULT now() NOT NULL,
	"updated" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "fdm-dev"."cultivations" ADD CONSTRAINT "cultivations_b_lu_catalogue_cultivations_catalogue_b_lu_catalogue_fk" FOREIGN KEY ("b_lu_catalogue") REFERENCES "fdm-dev"."cultivations_catalogue"("b_lu_catalogue") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fdm-dev"."farm_managing" ADD CONSTRAINT "farm_managing_b_id_fields_b_id_fk" FOREIGN KEY ("b_id") REFERENCES "fdm-dev"."fields"("b_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fdm-dev"."farm_managing" ADD CONSTRAINT "farm_managing_b_id_farm_farms_b_id_farm_fk" FOREIGN KEY ("b_id_farm") REFERENCES "fdm-dev"."farms"("b_id_farm") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fdm-dev"."fertilizer_acquiring" ADD CONSTRAINT "fertilizer_acquiring_b_id_farm_farms_b_id_farm_fk" FOREIGN KEY ("b_id_farm") REFERENCES "fdm-dev"."farms"("b_id_farm") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fdm-dev"."fertilizer_acquiring" ADD CONSTRAINT "fertilizer_acquiring_p_id_fertilizers_p_id_fk" FOREIGN KEY ("p_id") REFERENCES "fdm-dev"."fertilizers"("p_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fdm-dev"."fertilizer_applying" ADD CONSTRAINT "fertilizer_applying_b_id_fields_b_id_fk" FOREIGN KEY ("b_id") REFERENCES "fdm-dev"."fields"("b_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fdm-dev"."fertilizer_applying" ADD CONSTRAINT "fertilizer_applying_p_id_fertilizers_p_id_fk" FOREIGN KEY ("p_id") REFERENCES "fdm-dev"."fertilizers"("p_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fdm-dev"."fertilizer_picking" ADD CONSTRAINT "fertilizer_picking_p_id_fertilizers_p_id_fk" FOREIGN KEY ("p_id") REFERENCES "fdm-dev"."fertilizers"("p_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fdm-dev"."fertilizer_picking" ADD CONSTRAINT "fertilizer_picking_p_id_catalogue_fertilizers_catalogue_p_id_catalogue_fk" FOREIGN KEY ("p_id_catalogue") REFERENCES "fdm-dev"."fertilizers_catalogue"("p_id_catalogue") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fdm-dev"."field_sowing" ADD CONSTRAINT "field_sowing_b_id_fields_b_id_fk" FOREIGN KEY ("b_id") REFERENCES "fdm-dev"."fields"("b_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fdm-dev"."field_sowing" ADD CONSTRAINT "field_sowing_b_lu_cultivations_b_lu_fk" FOREIGN KEY ("b_lu") REFERENCES "fdm-dev"."cultivations"("b_lu") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fdm-dev"."soil_sampling" ADD CONSTRAINT "soil_sampling_b_id_fields_b_id_fk" FOREIGN KEY ("b_id") REFERENCES "fdm-dev"."fields"("b_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fdm-dev"."soil_sampling" ADD CONSTRAINT "soil_sampling_a_id_soil_analysis_a_id_fk" FOREIGN KEY ("a_id") REFERENCES "fdm-dev"."soil_analysis"("a_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "b_lu_idx" ON "fdm-dev"."cultivations" USING btree ("b_lu");--> statement-breakpoint
CREATE UNIQUE INDEX "b_lu_catalogue_idx" ON "fdm-dev"."cultivations_catalogue" USING btree ("b_lu_catalogue");--> statement-breakpoint
CREATE UNIQUE INDEX "b_id_farm_idx" ON "fdm-dev"."farms" USING btree ("b_id_farm");--> statement-breakpoint
CREATE UNIQUE INDEX "p_app_idx" ON "fdm-dev"."fertilizer_applying" USING btree ("p_app_id");--> statement-breakpoint
CREATE UNIQUE INDEX "p_id_idx" ON "fdm-dev"."fertilizers" USING btree ("p_id");--> statement-breakpoint
CREATE UNIQUE INDEX "p_id_catalogue_idx" ON "fdm-dev"."fertilizers_catalogue" USING btree ("p_id_catalogue");--> statement-breakpoint
CREATE UNIQUE INDEX "b_id_idx" ON "fdm-dev"."fields" USING btree ("b_id");--> statement-breakpoint
CREATE INDEX "b_geom_idx" ON "fdm-dev"."fields" USING gist ("b_geometry");