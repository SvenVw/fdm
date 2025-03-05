CREATE TABLE "fdm"."cultivation_catalogue_selecting" (
	"b_id_farm" text NOT NULL,
	"b_lu_source" text NOT NULL,
	"created" timestamp with time zone DEFAULT now() NOT NULL,
	"updated" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "fdm"."fertilizer_catalogue_enabling" (
	"b_id_farm" text NOT NULL,
	"p_source" text NOT NULL,
	"created" timestamp with time zone DEFAULT now() NOT NULL,
	"updated" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "fdm"."cultivation_catalogue_selecting" ADD CONSTRAINT "cultivation_catalogue_selecting_b_id_farm_farms_b_id_farm_fk" FOREIGN KEY ("b_id_farm") REFERENCES "fdm"."farms"("b_id_farm") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fdm"."fertilizer_catalogue_enabling" ADD CONSTRAINT "fertilizer_catalogue_enabling_b_id_farm_farms_b_id_farm_fk" FOREIGN KEY ("b_id_farm") REFERENCES "fdm"."farms"("b_id_farm") ON DELETE no action ON UPDATE no action;