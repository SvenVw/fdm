import { apiKeyClient } from "@better-auth/api-key/client"
import { adminClient, magicLinkClient, organizationClient } from "better-auth/client/plugins"
import { createAuthClient } from "better-auth/react"

export const authClient = createAuthClient({
  plugins: [organizationClient(), magicLinkClient(), adminClient(), apiKeyClient()],
})

export const { signIn, signOut, signUp, useSession } = authClient
