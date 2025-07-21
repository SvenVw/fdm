CREATE TABLE "fdm"."derogation_applying" (
	"b_id_farm" text NOT NULL,
	"b_id_derogation" text NOT NULL,
	"created" timestamp with time zone DEFAULT now() NOT NULL,
	"updated" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "fdm"."derogations" (
	"b_id_derogation" text PRIMARY KEY NOT NULL,
	"b_derogation_year" integer NOT NULL,
	"created" timestamp with time zone DEFAULT now() NOT NULL,
	"updated" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "fdm"."derogation_applying" ADD CONSTRAINT "derogation_applying_b_id_farm_farms_b_id_farm_fk" FOREIGN KEY ("b_id_farm") REFERENCES "fdm"."farms"("b_id_farm") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fdm"."derogation_applying" ADD CONSTRAINT "derogation_applying_b_id_derogation_derogations_b_id_derogation_fk" FOREIGN KEY ("b_id_derogation") REFERENCES "fdm"."derogations"("b_id_derogation") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "b_id_derogation_idx" ON "fdm"."derogations" USING btree ("b_id_derogation");--> statement-breakpoint