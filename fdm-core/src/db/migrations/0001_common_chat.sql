CREATE SCHEMA "fdm";
--> statement-breakpoint
CREATE SCHEMA "fdm-authn";
--> statement-breakpoint
CREATE SCHEMA "fdm-authz";
--> statement-breakpoint
CREATE TYPE "fdm"."b_acquiring_method" AS ENUM('owner', 'lease', 'unknown');--> statement-breakpoint
CREATE TYPE "fdm"."p_app_method" AS ENUM('slotted coulter', 'incorporation', 'injection', 'spraying', 'broadcasting', 'spoke wheel', 'pocket placement');--> statement-breakpoint
CREATE TYPE "fdm"."b_gwl_class" AS ENUM('II', 'IV', 'IIIb', 'V', 'VI', 'VII', 'Vb', '-', 'Va', 'III', 'VIII', 'sVI', 'I', 'IIb', 'sVII', 'IVu', 'bVII', 'sV', 'sVb', 'bVI', 'IIIa');--> statement-breakpoint
CREATE TYPE "fdm"."b_lu_harvestable" AS ENUM('none', 'once', 'multiple');--> statement-breakpoint
CREATE TYPE "fdm"."b_soiltype_agr" AS ENUM('moerige_klei', 'rivierklei', 'dekzand', 'zeeklei', 'dalgrond', 'veen', 'loess', 'duinzand', 'maasklei');--> statement-breakpoint
CREATE TABLE "fdm"."cultivation_ending" (
	"b_lu" text NOT NULL,
	"b_lu_end" timestamp with time zone,
	"created" timestamp with time zone DEFAULT now() NOT NULL,
	"updated" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "fdm"."cultivation_harvesting" (
	"b_id_harvesting" text PRIMARY KEY NOT NULL,
	"b_id_harvestable" text NOT NULL,
	"b_lu" text NOT NULL,
	"b_lu_harvest_date" timestamp with time zone,
	"created" timestamp with time zone DEFAULT now() NOT NULL,
	"updated" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "fdm"."cultivation_starting" (
	"b_id" text NOT NULL,
	"b_lu" text NOT NULL,
	"b_lu_start" timestamp with time zone,
	"b_sowing_amount" numeric,
	"b_sowing_method" text,
	"created" timestamp with time zone DEFAULT now() NOT NULL,
	"updated" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "fdm"."cultivations" (
	"b_lu" text PRIMARY KEY NOT NULL,
	"b_lu_catalogue" text NOT NULL,
	"created" timestamp with time zone DEFAULT now() NOT NULL,
	"updated" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "fdm"."cultivations_catalogue" (
	"b_lu_catalogue" text PRIMARY KEY NOT NULL,
	"b_lu_source" text NOT NULL,
	"b_lu_name" text NOT NULL,
	"b_lu_name_en" text,
	"b_lu_harvestable" "fdm"."b_lu_harvestable" NOT NULL,
	"b_lu_hcat3" text,
	"b_lu_hcat3_name" text,
	"created" timestamp with time zone DEFAULT now() NOT NULL,
	"updated" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "fdm"."farms" (
	"b_id_farm" text PRIMARY KEY NOT NULL,
	"b_name_farm" text,
	"b_businessid_farm" text,
	"b_address_farm" text,
	"b_postalcode_farm" text,
	"created" timestamp with time zone DEFAULT now() NOT NULL,
	"updated" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "fdm"."fertilizer_acquiring" (
	"b_id_farm" text NOT NULL,
	"p_id" text NOT NULL,
	"p_acquiring_amount" numeric,
	"p_acquiring_date" timestamp with time zone,
	"created" timestamp with time zone DEFAULT now() NOT NULL,
	"updated" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "fdm"."fertilizer_applying" (
	"p_app_id" text PRIMARY KEY NOT NULL,
	"b_id" text NOT NULL,
	"p_id" text NOT NULL,
	"p_app_amount" numeric,
	"p_app_method" "fdm"."p_app_method",
	"p_app_date" timestamp with time zone,
	"created" timestamp with time zone DEFAULT now() NOT NULL,
	"updated" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "fdm"."fertilizer_picking" (
	"p_id" text NOT NULL,
	"p_id_catalogue" text NOT NULL,
	"p_picking_date" timestamp with time zone,
	"created" timestamp with time zone DEFAULT now() NOT NULL,
	"updated" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "fdm"."fertilizers" (
	"p_id" text PRIMARY KEY NOT NULL,
	"created" timestamp with time zone DEFAULT now() NOT NULL,
	"updated" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "fdm"."fertilizers_catalogue" (
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
CREATE TABLE "fdm"."field_acquiring" (
	"b_id" text NOT NULL,
	"b_id_farm" text NOT NULL,
	"b_start" timestamp with time zone,
	"b_acquiring_method" "fdm"."b_acquiring_method" DEFAULT 'unknown' NOT NULL,
	"created" timestamp with time zone DEFAULT now() NOT NULL,
	"updated" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "fdm"."field_discarding" (
	"b_id" text NOT NULL,
	"b_end" timestamp with time zone,
	"created" timestamp with time zone DEFAULT now() NOT NULL,
	"updated" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "fdm"."fields" (
	"b_id" text PRIMARY KEY NOT NULL,
	"b_name" text NOT NULL,
	"b_geometry" geometry(Polygon,4326),
	"b_id_source" text,
	"created" timestamp with time zone DEFAULT now() NOT NULL,
	"updated" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "fdm"."harvestable_analyses" (
	"b_id_harvestable_analysis" text PRIMARY KEY NOT NULL,
	"b_lu_yield" numeric,
	"b_lu_n_harvestable" numeric,
	"b_lu_n_residue" numeric,
	"b_lu_p_harvestable" numeric,
	"b_lu_p_residue" numeric,
	"b_lu_k_harvestable" numeric,
	"b_lu_k_residue" numeric,
	"created" timestamp with time zone DEFAULT now() NOT NULL,
	"updated" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "fdm"."harvestable_sampling" (
	"b_id_harvestable" text NOT NULL,
	"b_id_harvestable_analysis" text NOT NULL,
	"b_sampling_date" timestamp with time zone,
	"created" timestamp with time zone DEFAULT now() NOT NULL,
	"updated" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "fdm"."harvestables" (
	"b_id_harvestable" text PRIMARY KEY NOT NULL,
	"created" timestamp with time zone DEFAULT now() NOT NULL,
	"updated" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "fdm"."soil_analysis" (
	"a_id" text PRIMARY KEY NOT NULL,
	"a_date" timestamp with time zone,
	"a_source" text,
	"a_p_al" numeric,
	"a_p_cc" numeric,
	"a_som_loi" numeric,
	"b_gwl_class" "fdm"."b_gwl_class",
	"b_soiltype_agr" "fdm"."b_soiltype_agr",
	"created" timestamp with time zone DEFAULT now() NOT NULL,
	"updated" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "fdm"."soil_sampling" (
	"b_id_sampling" text PRIMARY KEY NOT NULL,
	"b_id" text NOT NULL,
	"a_id" text NOT NULL,
	"b_depth" numeric,
	"b_sampling_date" timestamp with time zone,
	"b_sampling_geometry" geometry(MultiPoint,4326),
	"created" timestamp with time zone DEFAULT now() NOT NULL,
	"updated" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "fdm-authn"."account" (
	"id" text PRIMARY KEY NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"user_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp,
	"refresh_token_expires_at" timestamp,
	"scope" text,
	"password" text,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "fdm-authn"."rate_limit" (
	"id" text PRIMARY KEY NOT NULL,
	"key" text,
	"count" integer,
	"last_request" bigint
);
--> statement-breakpoint
CREATE TABLE "fdm-authn"."session" (
	"id" text PRIMARY KEY NOT NULL,
	"expires_at" timestamp NOT NULL,
	"token" text NOT NULL,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"user_id" text NOT NULL,
	CONSTRAINT "session_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "fdm-authn"."user" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"email_verified" boolean NOT NULL,
	"image" text,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL,
	"firstname" text,
	"surname" text,
	"lang" text NOT NULL,
	"farm_active" text,
	CONSTRAINT "user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "fdm-authn"."verification" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp,
	"updated_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "fdm-authz"."audit" (
	"audit_id" text PRIMARY KEY NOT NULL,
	"audit_timestamp" timestamp with time zone DEFAULT now() NOT NULL,
	"audit_origin" text NOT NULL,
	"principal_id" text NOT NULL,
	"target_resource" text NOT NULL,
	"target_resource_id" text NOT NULL,
	"granting_resource" text NOT NULL,
	"granting_resource_id" text NOT NULL,
	"action" text NOT NULL,
	"allowed" boolean NOT NULL,
	"duration" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "fdm-authz"."role" (
	"role_id" text PRIMARY KEY NOT NULL,
	"resource" text NOT NULL,
	"resource_id" text NOT NULL,
	"principal_id" text NOT NULL,
	"role" text NOT NULL,
	"created" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "fdm"."cultivation_ending" ADD CONSTRAINT "cultivation_ending_b_lu_cultivations_b_lu_fk" FOREIGN KEY ("b_lu") REFERENCES "fdm"."cultivations"("b_lu") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fdm"."cultivation_harvesting" ADD CONSTRAINT "cultivation_harvesting_b_id_harvestable_harvestables_b_id_harvestable_fk" FOREIGN KEY ("b_id_harvestable") REFERENCES "fdm"."harvestables"("b_id_harvestable") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fdm"."cultivation_harvesting" ADD CONSTRAINT "cultivation_harvesting_b_lu_cultivations_b_lu_fk" FOREIGN KEY ("b_lu") REFERENCES "fdm"."cultivations"("b_lu") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fdm"."cultivation_starting" ADD CONSTRAINT "cultivation_starting_b_id_fields_b_id_fk" FOREIGN KEY ("b_id") REFERENCES "fdm"."fields"("b_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fdm"."cultivation_starting" ADD CONSTRAINT "cultivation_starting_b_lu_cultivations_b_lu_fk" FOREIGN KEY ("b_lu") REFERENCES "fdm"."cultivations"("b_lu") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fdm"."cultivations" ADD CONSTRAINT "cultivations_b_lu_catalogue_cultivations_catalogue_b_lu_catalogue_fk" FOREIGN KEY ("b_lu_catalogue") REFERENCES "fdm"."cultivations_catalogue"("b_lu_catalogue") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fdm"."fertilizer_acquiring" ADD CONSTRAINT "fertilizer_acquiring_b_id_farm_farms_b_id_farm_fk" FOREIGN KEY ("b_id_farm") REFERENCES "fdm"."farms"("b_id_farm") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fdm"."fertilizer_acquiring" ADD CONSTRAINT "fertilizer_acquiring_p_id_fertilizers_p_id_fk" FOREIGN KEY ("p_id") REFERENCES "fdm"."fertilizers"("p_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fdm"."fertilizer_applying" ADD CONSTRAINT "fertilizer_applying_b_id_fields_b_id_fk" FOREIGN KEY ("b_id") REFERENCES "fdm"."fields"("b_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fdm"."fertilizer_applying" ADD CONSTRAINT "fertilizer_applying_p_id_fertilizers_p_id_fk" FOREIGN KEY ("p_id") REFERENCES "fdm"."fertilizers"("p_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fdm"."fertilizer_picking" ADD CONSTRAINT "fertilizer_picking_p_id_fertilizers_p_id_fk" FOREIGN KEY ("p_id") REFERENCES "fdm"."fertilizers"("p_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fdm"."fertilizer_picking" ADD CONSTRAINT "fertilizer_picking_p_id_catalogue_fertilizers_catalogue_p_id_catalogue_fk" FOREIGN KEY ("p_id_catalogue") REFERENCES "fdm"."fertilizers_catalogue"("p_id_catalogue") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fdm"."field_acquiring" ADD CONSTRAINT "field_acquiring_b_id_fields_b_id_fk" FOREIGN KEY ("b_id") REFERENCES "fdm"."fields"("b_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fdm"."field_acquiring" ADD CONSTRAINT "field_acquiring_b_id_farm_farms_b_id_farm_fk" FOREIGN KEY ("b_id_farm") REFERENCES "fdm"."farms"("b_id_farm") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fdm"."field_discarding" ADD CONSTRAINT "field_discarding_b_id_fields_b_id_fk" FOREIGN KEY ("b_id") REFERENCES "fdm"."fields"("b_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fdm"."harvestable_sampling" ADD CONSTRAINT "harvestable_sampling_b_id_harvestable_harvestables_b_id_harvestable_fk" FOREIGN KEY ("b_id_harvestable") REFERENCES "fdm"."harvestables"("b_id_harvestable") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fdm"."harvestable_sampling" ADD CONSTRAINT "harvestable_sampling_b_id_harvestable_analysis_harvestable_analyses_b_id_harvestable_analysis_fk" FOREIGN KEY ("b_id_harvestable_analysis") REFERENCES "fdm"."harvestable_analyses"("b_id_harvestable_analysis") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fdm"."soil_sampling" ADD CONSTRAINT "soil_sampling_b_id_fields_b_id_fk" FOREIGN KEY ("b_id") REFERENCES "fdm"."fields"("b_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fdm"."soil_sampling" ADD CONSTRAINT "soil_sampling_a_id_soil_analysis_a_id_fk" FOREIGN KEY ("a_id") REFERENCES "fdm"."soil_analysis"("a_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fdm-authn"."account" ADD CONSTRAINT "account_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "fdm-authn"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fdm-authn"."session" ADD CONSTRAINT "session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "fdm-authn"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "b_lu_idx" ON "fdm"."cultivations" USING btree ("b_lu");--> statement-breakpoint
CREATE UNIQUE INDEX "b_lu_catalogue_idx" ON "fdm"."cultivations_catalogue" USING btree ("b_lu_catalogue");--> statement-breakpoint
CREATE UNIQUE INDEX "b_id_farm_idx" ON "fdm"."farms" USING btree ("b_id_farm");--> statement-breakpoint
CREATE UNIQUE INDEX "p_app_idx" ON "fdm"."fertilizer_applying" USING btree ("p_app_id");--> statement-breakpoint
CREATE UNIQUE INDEX "p_id_idx" ON "fdm"."fertilizers" USING btree ("p_id");--> statement-breakpoint
CREATE UNIQUE INDEX "p_id_catalogue_idx" ON "fdm"."fertilizers_catalogue" USING btree ("p_id_catalogue");--> statement-breakpoint
CREATE UNIQUE INDEX "b_id_idx" ON "fdm"."fields" USING btree ("b_id");--> statement-breakpoint
CREATE INDEX "b_geom_idx" ON "fdm"."fields" USING gist ("b_geometry");--> statement-breakpoint
CREATE UNIQUE INDEX "b_id_harvestable_analyses_idx" ON "fdm"."harvestable_analyses" USING btree ("b_id_harvestable_analysis");--> statement-breakpoint
CREATE UNIQUE INDEX "b_id_harvestable_idx" ON "fdm"."harvestables" USING btree ("b_id_harvestable");--> statement-breakpoint
CREATE INDEX "role_idx" ON "fdm-authz"."role" USING btree ("resource","resource_id","principal_id","role","deleted");