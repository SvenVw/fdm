CREATE TABLE "fdm-helpdesk"."impersonation_requests" (
	"impersonation_request_id" text PRIMARY KEY NOT NULL,
	"goal" text,
	"target_principal_id" text NOT NULL,
	"agent_id" text NOT NULL,
	"ticket_id" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"duration" interval NOT NULL,
	"created" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone,
	"accepted_at" timestamp with time zone,
	"cancelled_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "fdm-helpdesk"."impersonation_requests" ADD CONSTRAINT "impersonation_requests_agent_id_agents_agent_id_fk" FOREIGN KEY ("agent_id") REFERENCES "fdm-helpdesk"."agents"("agent_id") ON DELETE cascade ON UPDATE no action;