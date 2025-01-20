CREATE TABLE "fdm-dev"."cultivation_harvesting" (
	"b_id_harvestable" text NOT NULL,
	"b_lu" text NOT NULL,
	"b_date_harvest" timestamp with time zone,
	"created" timestamp with time zone DEFAULT now() NOT NULL,
	"updated" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "fdm-dev"."cultivation_terminating" (
	"b_lu" text NOT NULL,
	"b_date_terminate" timestamp with time zone,
	"created" timestamp with time zone DEFAULT now() NOT NULL,
	"updated" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "fdm-dev"."harvestable_analyses" (
	"b_id_harvestable_analysis" text PRIMARY KEY NOT NULL,
	"b_lu_yield" numeric,
	"b_lu_n_harvestable" numeric,
	"created" timestamp with time zone DEFAULT now() NOT NULL,
	"updated" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "fdm-dev"."harvestable_sampling" (
	"b_id_harvestable" text NOT NULL,
	"b_id_harvestable_analysis" text NOT NULL,
	"b_date_sampling" timestamp with time zone,
	"created" timestamp with time zone DEFAULT now() NOT NULL,
	"updated" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "fdm-dev"."harvestables" (
	"b_id_harvestable" text PRIMARY KEY NOT NULL,
	"created" timestamp with time zone DEFAULT now() NOT NULL,
	"updated" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "fdm-dev"."cultivation_harvesting" ADD CONSTRAINT "cultivation_harvesting_b_id_harvestable_harvestables_b_id_harvestable_fk" FOREIGN KEY ("b_id_harvestable") REFERENCES "fdm-dev"."harvestables"("b_id_harvestable") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fdm-dev"."cultivation_harvesting" ADD CONSTRAINT "cultivation_harvesting_b_lu_cultivations_b_lu_fk" FOREIGN KEY ("b_lu") REFERENCES "fdm-dev"."cultivations"("b_lu") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fdm-dev"."cultivation_terminating" ADD CONSTRAINT "cultivation_terminating_b_lu_cultivations_b_lu_fk" FOREIGN KEY ("b_lu") REFERENCES "fdm-dev"."cultivations"("b_lu") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fdm-dev"."harvestable_sampling" ADD CONSTRAINT "harvestable_sampling_b_id_harvestable_harvestables_b_id_harvestable_fk" FOREIGN KEY ("b_id_harvestable") REFERENCES "fdm-dev"."harvestables"("b_id_harvestable") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fdm-dev"."harvestable_sampling" ADD CONSTRAINT "harvestable_sampling_b_id_harvestable_analysis_harvestable_analyses_b_id_harvestable_analysis_fk" FOREIGN KEY ("b_id_harvestable_analysis") REFERENCES "fdm-dev"."harvestable_analyses"("b_id_harvestable_analysis") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "b_id_harvestable_analyses_idx" ON "fdm-dev"."harvestable_analyses" USING btree ("b_id_harvestable_analysis");--> statement-breakpoint
CREATE UNIQUE INDEX "b_id_harvestable_idx" ON "fdm-dev"."harvestables" USING btree ("b_id_harvestable");