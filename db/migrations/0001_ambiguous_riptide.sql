CREATE TABLE "coach_client_links" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"coach_id" uuid DEFAULT auth.uid() NOT NULL,
	"client_id" uuid,
	"client_email" text NOT NULL,
	"invite_token" uuid DEFAULT gen_random_uuid() NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"accepted_at" timestamp with time zone,
	CONSTRAINT "coach_client_links_invite_token_unique" UNIQUE("invite_token")
);
--> statement-breakpoint
ALTER TABLE "coach_client_links" ADD CONSTRAINT "coach_client_links_coach_id_profiles_id_fk" FOREIGN KEY ("coach_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "coach_client_links" ADD CONSTRAINT "coach_client_links_client_id_profiles_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;