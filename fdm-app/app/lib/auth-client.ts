/**
 * @file This file configures and exports the client-side authentication functionality
 * for the application using the `better-auth` library.
 *
 * It initializes the `better-auth` client with plugins for magic link and organization
 * handling, and then exports the core authentication hooks and functions (`signIn`,
 * `signOut`, `signUp`, `useSession`) for use in the application's UI components.
 *
 * @packageDocumentation
 */
import { magicLinkClient, organizationClient } from "better-auth/client/plugins"
import { createAuthClient } from "better-auth/react"

/**
 * The initialized `better-auth` client instance for the application.
 */
export const authClient = createAuthClient({
    plugins: [organizationClient(), magicLinkClient()],
})

/**
 * Exported authentication functions and the `useSession` hook for easy access
 * throughout the client-side of the application.
 */
export const { signIn, signOut, signUp, useSession } = authClient
