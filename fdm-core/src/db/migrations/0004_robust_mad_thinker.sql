ALTER TABLE "fdm-dev"."cultivations_catalogue" ADD COLUMN "created" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "fdm-dev"."cultivations_catalogue" ADD COLUMN "updated" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "fdm-dev"."soil_analysis" ADD COLUMN "created" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "fdm-dev"."soil_analysis" ADD COLUMN "updated" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "fdm-dev"."soil_sampling" ADD COLUMN "created" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "fdm-dev"."soil_sampling" ADD COLUMN "updated" timestamp with time zone;