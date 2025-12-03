import {
    inferAdditionalFields,
    magicLinkClient,
    organizationClient,
} from "better-auth/client/plugins"
import { createAuthClient } from "better-auth/react"
import type { auth } from "./auth.server"

export const authClient = createAuthClient({
    plugins: [
        organizationClient(),
        magicLinkClient(),
        inferAdditionalFields<typeof auth>(),
    ],
})

export const { signIn, signOut, signUp, useSession } = authClient
