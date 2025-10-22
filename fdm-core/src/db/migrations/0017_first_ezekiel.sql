CREATE SCHEMA "fdm-calculator";
--> statement-breakpoint
CREATE TABLE "fdm-calculator"."calculation_cache" (
	"calculation_hash" text PRIMARY KEY NOT NULL,
	"calculation_function" text NOT NULL,
	"calculator_version" text,
	"input" jsonb,
	"result" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "fdm-calculator"."calculation_errors" (
	"calculation_error_id" text PRIMARY KEY NOT NULL,
	"calculation_function" text,
	"calculator_version" text,
	"input" jsonb,
	"error_message" text,
	"stack_trace" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
