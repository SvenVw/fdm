CREATE SCHEMA "fdm-dev";
--> statement-breakpoint
CREATE TYPE "fdm-dev"."b_manage_type" AS ENUM('owner', 'lease');--> statement-breakpoint
CREATE TYPE "fdm-dev"."b_sector" AS ENUM('diary', 'arable', 'tree_nursery', 'bulbs');--> statement-breakpoint
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
	"p_date_acquiring" timestamp with time zone,
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
CREATE TABLE IF NOT EXISTS "fdm-dev"."fields" (
	"b_id" text PRIMARY KEY NOT NULL,
	"b_name" text,
	"created" timestamp with time zone DEFAULT now() NOT NULL,
	"updated" timestamp with time zone
);
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
CREATE UNIQUE INDEX IF NOT EXISTS "b_id_b_id_farm_idx" ON "fdm-dev"."farm_managing" USING btree ("b_id","b_id_farm");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "b_id_farm_idx" ON "fdm-dev"."farms" USING btree ("b_id_farm");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "p_id_idx" ON "fdm-dev"."fertilizers" USING btree ("p_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "p_id_catalogue_idx" ON "fdm-dev"."fertilizers_catalogue" USING btree ("p_id_catalogue");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "b_id_idx" ON "fdm-dev"."fields" USING btree ("b_id");