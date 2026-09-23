ALTER TABLE "coach_invites" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "coach_invites" CASCADE;--> statement-breakpoint
ALTER TABLE "coach_client_links" DROP CONSTRAINT "coach_client_links_invite_token_unique";--> statement-breakpoint
ALTER TABLE "coach_client_links" DROP COLUMN "client_email";--> statement-breakpoint
ALTER TABLE "coach_client_links" DROP COLUMN "invite_token";--> statement-breakpoint
ALTER TABLE "profiles" DROP COLUMN "role";