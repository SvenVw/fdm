CREATE SCHEMA "fdm-dev";
--> statement-breakpoint
CREATE TYPE "fdm-dev"."b_manage_type" AS ENUM('owner', 'lease');--> statement-breakpoint
CREATE TYPE "fdm-dev"."b_sector" AS ENUM('diary', 'arable', 'tree_nursery', 'bulbs');--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "fdm-dev"."cultivations" (
	"b_lu" text PRIMARY KEY NOT NULL,
	"b_lu_catalogue" text NOT NULL,
	"created" timestamp with time zone DEFAULT now() NOT NULL,
	"updated" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "fdm-dev"."cultivations_catalogue" (
	"b_lu_catalogue" text PRIMARY KEY NOT NULL,
	"b_lu_source" text NOT NULL,
	"b_lu_name" text NOT NULL,
	"b_lu_name_en" text,
	"b_lu_hcat3" text,
	"b_lu_hcat3_name" text
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "fdm-dev"."farm_managing" (
	"b_id" text NOT NULL,
	"b_id_farm" text NOT NULL,
	"b_manage_start" date,
	"b_manage_end" date,
	"b_manage_type" "fdm-dev"."b_manage_type",
	"created" timestamp with time zone DEFAULT now() NOT NULL,
	"updated" timestamp with time zone,
	CONSTRAINT "farm_managing_b_id_b_id_farm_pk" PRIMARY KEY("b_id","b_id_farm")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "fdm-dev"."farms" (
	"b_id_farm" text PRIMARY KEY NOT NULL,
	"b_name_farm" text,
	"b_sector" "fdm-dev"."b_sector",
	"created" timestamp with time zone DEFAULT now() NOT NULL,
	"updated" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "fdm-dev"."fertilizer_aquiring" (
	"b_id_farm" text NOT NULL,
	"p_id" text NOT NULL,
	"p_amount" numeric,
	"p_acquiring_date" date,
	"created" timestamp with time zone DEFAULT now() NOT NULL,
	"updated" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "fdm-dev"."fertilizer_applying" (
	"p_app_id" text PRIMARY KEY NOT NULL,
	"b_id" text NOT NULL,
	"p_id" text NOT NULL,
	"p_amount" numeric,
	"p_app_method" "p_app_method",
	"p_app_date" date,
	"created" timestamp with time zone DEFAULT now() NOT NULL,
	"updated" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "fdm-dev"."fertilizer_picking" (
	"p_id" text NOT NULL,
	"p_id_catalogue" text NOT NULL,
	"p_picking_date" timestamp with time zone,
	"created" timestamp with time zone DEFAULT now() NOT NULL,
	"updated" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "fdm-dev"."fertilizers" (
	"p_id" text PRIMARY KEY NOT NULL,
	"created" timestamp with time zone DEFAULT now() NOT NULL,
	"updated" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "fdm-dev"."fertilizers_catalogue" (
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
CREATE TABLE IF NOT EXISTS "fdm-dev"."field_sowing" (
	"b_id" text NOT NULL,
	"b_lu" text NOT NULL,
	"b_sowing_date" date,
	"b_sowing_amount" numeric,
	"b_sowing_method" text,
	"created" timestamp with time zone DEFAULT now() NOT NULL,
	"updated" timestamp with time zone,
	CONSTRAINT "field_sowing_b_id_b_lu_pk" PRIMARY KEY("b_id","b_lu")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "fdm-dev"."fields" (
	"b_id" text PRIMARY KEY NOT NULL,
	"b_name" text,
	"b_geometry" geometry(polygon),
	"b_id_source" text,
	"created" timestamp with time zone DEFAULT now() NOT NULL,
	"updated" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "fdm-dev"."grants" (
	"b_farm_id" text NOT NULL,
	"user_id" text NOT NULL,
	"created" timestamp with time zone DEFAULT now() NOT NULL,
	"destroyed" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "fdm-dev"."session" (
	"session_id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"created" timestamp with time zone DEFAULT now() NOT NULL,
	"updated" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "fdm-dev"."users" (
	"user_id" text PRIMARY KEY NOT NULL,
	"firstname" text,
	"surname" text,
	"email" text,
	"created" timestamp with time zone DEFAULT now() NOT NULL,
	"updated" timestamp with time zone
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "fdm-dev"."cultivations" ADD CONSTRAINT "cultivations_b_lu_catalogue_cultivations_catalogue_b_lu_catalogue_fk" FOREIGN KEY ("b_lu_catalogue") REFERENCES "fdm-dev"."cultivations_catalogue"("b_lu_catalogue") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "fdm-dev"."farm_managing" ADD CONSTRAINT "farm_managing_b_id_fields_b_id_fk" FOREIGN KEY ("b_id") REFERENCES "fdm-dev"."fields"("b_id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "fdm-dev"."farm_managing" ADD CONSTRAINT "farm_managing_b_id_farm_farms_b_id_farm_fk" FOREIGN KEY ("b_id_farm") REFERENCES "fdm-dev"."farms"("b_id_farm") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "fdm-dev"."fertilizer_aquiring" ADD CONSTRAINT "fertilizer_aquiring_b_id_farm_farms_b_id_farm_fk" FOREIGN KEY ("b_id_farm") REFERENCES "fdm-dev"."farms"("b_id_farm") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "fdm-dev"."fertilizer_aquiring" ADD CONSTRAINT "fertilizer_aquiring_p_id_fertilizers_p_id_fk" FOREIGN KEY ("p_id") REFERENCES "fdm-dev"."fertilizers"("p_id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "fdm-dev"."fertilizer_applying" ADD CONSTRAINT "fertilizer_applying_b_id_fields_b_id_fk" FOREIGN KEY ("b_id") REFERENCES "fdm-dev"."fields"("b_id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "fdm-dev"."fertilizer_applying" ADD CONSTRAINT "fertilizer_applying_p_id_fertilizers_p_id_fk" FOREIGN KEY ("p_id") REFERENCES "fdm-dev"."fertilizers"("p_id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "fdm-dev"."fertilizer_picking" ADD CONSTRAINT "fertilizer_picking_p_id_fertilizers_p_id_fk" FOREIGN KEY ("p_id") REFERENCES "fdm-dev"."fertilizers"("p_id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "fdm-dev"."fertilizer_picking" ADD CONSTRAINT "fertilizer_picking_p_id_catalogue_fertilizers_catalogue_p_id_catalogue_fk" FOREIGN KEY ("p_id_catalogue") REFERENCES "fdm-dev"."fertilizers_catalogue"("p_id_catalogue") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "fdm-dev"."field_sowing" ADD CONSTRAINT "field_sowing_b_id_fields_b_id_fk" FOREIGN KEY ("b_id") REFERENCES "fdm-dev"."fields"("b_id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "fdm-dev"."field_sowing" ADD CONSTRAINT "field_sowing_b_lu_cultivations_b_lu_fk" FOREIGN KEY ("b_lu") REFERENCES "fdm-dev"."cultivations"("b_lu") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "fdm-dev"."grants" ADD CONSTRAINT "grants_b_farm_id_farms_b_id_farm_fk" FOREIGN KEY ("b_farm_id") REFERENCES "fdm-dev"."farms"("b_id_farm") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "fdm-dev"."grants" ADD CONSTRAINT "grants_user_id_users_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "fdm-dev"."users"("user_id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "fdm-dev"."session" ADD CONSTRAINT "session_user_id_users_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "fdm-dev"."users"("user_id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "b_lu_idx" ON "fdm-dev"."cultivations" USING btree ("b_lu");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "b_lu_catalogue_idx" ON "fdm-dev"."cultivations_catalogue" USING btree ("b_lu_catalogue");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "b_id_farm_idx" ON "fdm-dev"."farms" USING btree ("b_id_farm");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "p_app_idx" ON "fdm-dev"."fertilizer_applying" USING btree ("p_app_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "p_id_idx" ON "fdm-dev"."fertilizers" USING btree ("p_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "p_id_catalogue_idx" ON "fdm-dev"."fertilizers_catalogue" USING btree ("p_id_catalogue");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "b_id_idx" ON "fdm-dev"."fields" USING btree ("b_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "b_geom_idx" ON "fdm-dev"."fields" USING gist ("b_geometry");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "session_id_idx" ON "fdm-dev"."session" USING btree ("session_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "user_id_idx" ON "fdm-dev"."users" USING btree ("user_id");