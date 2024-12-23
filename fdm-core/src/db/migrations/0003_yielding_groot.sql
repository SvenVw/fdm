CREATE TYPE "fdm-dev"."b_gwl_class" AS ENUM('II', 'IV', 'IIIb', 'V', 'VI', 'VII', 'Vb', '-|', 'Va', 'III', 'VIII', 'sVI', 'I', 'IIb', 'sVII', 'IVu', 'bVII', 'sV', 'sVb', 'bVI', 'IIIa');--> statement-breakpoint
CREATE TYPE "fdm-dev"."b_soiltype_agr" AS ENUM('moerige_klei', 'rivierklei', 'dekzand', 'zeeklei', 'dalgrond', 'veen', 'loess', 'duinzand', 'maasklei');--> statement-breakpoint
CREATE TABLE "fdm-dev"."soil_analysis" (
	"a_id" text PRIMARY KEY NOT NULL,
	"a_date" timestamp with time zone,
	"a_source" text,
	"a_p_al" numeric,
	"a_p_cc" numeric,
	"a_som_loi" numeric,
	"b_gwl_class" "fdm-dev"."b_gwl_class",
	"b_soiltype_agr" "fdm-dev"."b_soiltype_agr"
);
--> statement-breakpoint
CREATE TABLE "fdm-dev"."soil_sampling" (
	"b_id_sampling" text PRIMARY KEY NOT NULL,
	"b_id" text NOT NULL,
	"a_id" text NOT NULL,
	"b_depth" numeric,
	"b_sampling_date" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "fdm-dev"."soil_sampling" ADD CONSTRAINT "soil_sampling_b_id_fields_b_id_fk" FOREIGN KEY ("b_id") REFERENCES "fdm-dev"."fields"("b_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fdm-dev"."soil_sampling" ADD CONSTRAINT "soil_sampling_a_id_soil_analysis_a_id_fk" FOREIGN KEY ("a_id") REFERENCES "fdm-dev"."soil_analysis"("a_id") ON DELETE no action ON UPDATE no action;