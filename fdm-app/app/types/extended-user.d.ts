import type { User as BetterAuthUser } from "better-auth"

// Extend the User type from better-auth to include additional fields
export interface ExtendedUser extends BetterAuthUser {
    firstname?: string | null
    surname?: string | null
}
