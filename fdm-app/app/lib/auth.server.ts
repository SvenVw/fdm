import { createFdmAuth } from "@svenvw/fdm-core"
import { fdm } from "@/lib/fdm.server"

// Initialize better-auth instance for FDM
export const auth = createFdmAuth(fdm)

// Get the session
export async function getSession(request: Request) {
    const session = await auth.api.getSession({
        headers: request.headers,
    })

    if (!session) {
        throw new Response("Unauthorized", { status: 401 })
    }

    // Add username to session
    const sessionWithUserName = {
        ...session,
        userName: session.user.firstname ?? session.user.name,
        principal_id: session.user.id,
    }

    return sessionWithUserName
}
