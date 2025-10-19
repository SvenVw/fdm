CREATE SCHEMA "fdm-calculator";
--> statement-breakpoint
CREATE TABLE "fdm-calculator"."calculation_cache" (
	"calculation_type" text NOT NULL,
	"input_hash" text NOT NULL,
	"calculator_version" text,
	"inputs" json,
	"result" json,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "fdm-calculator"."calculation_errors" (
	"id" serial PRIMARY KEY NOT NULL,
	"calculation_type" text,
	"calculator_version" text,
	"inputs" json,
	"error_message" text,
	"stack_trace" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
