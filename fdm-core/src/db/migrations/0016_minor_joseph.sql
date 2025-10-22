CREATE TYPE "fdm"."p_type_rvo" AS ENUM('10', '11', '12', '13', '14', '17', '18', '19', '23', '30', '31', '32', '33', '35', '39', '40', '41', '42', '43', '46', '50', '56', '60', '61', '75', '76', '80', '81', '90', '91', '92', '25', '26', '27', '95', '96', '97', '98', '99', '100', '101', '102', '103', '104', '105', '106', '107', '108', '109', '110', '111', '112', '113', '114', '115', '116', '117', '120');--> statement-breakpoint
CREATE TABLE "fdm"."intending_grazing" (
	"b_id_farm" text NOT NULL,
	"b_grazing_intention" boolean,
	"b_grazing_intention_year" integer NOT NULL,
	"created" timestamp with time zone DEFAULT now() NOT NULL,
	"updated" timestamp with time zone,
	CONSTRAINT "intending_grazing_b_id_farm_b_grazing_intention_year_pk" PRIMARY KEY("b_id_farm","b_grazing_intention_year")
);
--> statement-breakpoint
CREATE TABLE "fdm"."organic_certifications" (
	"b_id_organic" text PRIMARY KEY NOT NULL,
	"b_organic_traces" text,
	"b_organic_skal" text,
	"b_organic_issued" timestamp with time zone,
	"b_organic_expires" timestamp with time zone,
	"created" timestamp with time zone DEFAULT now() NOT NULL,
	"updated" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "fdm"."organic_certifications_holding" (
	"b_id_farm" text NOT NULL,
	"b_id_organic" text NOT NULL,
	"created" timestamp with time zone DEFAULT now() NOT NULL,
	"updated" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "fdm"."fertilizers_catalogue" ADD COLUMN "p_type_rvo" "fdm"."p_type_rvo";--> statement-breakpoint
ALTER TABLE "fdm"."intending_grazing" ADD CONSTRAINT "intending_grazing_b_id_farm_farms_b_id_farm_fk" FOREIGN KEY ("b_id_farm") REFERENCES "fdm"."farms"("b_id_farm") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fdm"."organic_certifications_holding" ADD CONSTRAINT "organic_certifications_holding_b_id_farm_farms_b_id_farm_fk" FOREIGN KEY ("b_id_farm") REFERENCES "fdm"."farms"("b_id_farm") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fdm"."organic_certifications_holding" ADD CONSTRAINT "organic_certifications_holding_b_id_organic_organic_certifications_b_id_organic_fk" FOREIGN KEY ("b_id_organic") REFERENCES "fdm"."organic_certifications"("b_id_organic") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "organic_one_farm_per_cert" ON "fdm"."organic_certifications_holding" USING btree ("b_id_organic");--> statement-breakpoint
CREATE UNIQUE INDEX "derogation_one_per_farm_per" ON "fdm"."derogation_applying" USING btree ("b_id_derogation");