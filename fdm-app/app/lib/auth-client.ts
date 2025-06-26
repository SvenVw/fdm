import { magicLinkClient, organizationClient } from "better-auth/client/plugins"
import { createAuthClient } from "better-auth/react"

export const authClient = createAuthClient({
    plugins: [organizationClient(), magicLinkClient()],
})

export const { signIn, signOut, signUp, useSession } = authClient
