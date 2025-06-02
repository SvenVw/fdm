import type { User as BetterAuthUser } from "better-auth"

// Extend the User type from better-auth to include additional fields
export interface ExtendedUser extends BetterAuthUser {
    userName: string | null | undefined
    firstname?: string | null
    surname?: string | null
    displayUsername?: string | null
}
