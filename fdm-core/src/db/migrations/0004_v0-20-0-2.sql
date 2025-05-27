ALTER TABLE "fdm-authn"."user" ADD COLUMN "username" text;--> statement-breakpoint
ALTER TABLE "fdm-authn"."user" ADD COLUMN "display_username" text;--> statement-breakpoint
ALTER TABLE "fdm-authn"."user" ADD CONSTRAINT "user_username_unique" UNIQUE("username");