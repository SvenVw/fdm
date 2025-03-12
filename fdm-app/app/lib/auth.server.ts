import { fdm } from "@/lib/fdm.server"
import { createFdmAuth } from "@svenvw/fdm-core"
import type { Session, User } from "better-auth"

// Initialize better-auth instance for FDM
export const auth = createFdmAuth(fdm)

// Get the session
export async function getSession(request: Request): Promise<FdmSession> {
    const session = await auth.api.getSession({
        headers: request.headers,
    })

    if (!session) {
        throw new Response("Unauthorized", { status: 401 })
    }

    // Determine avatar initials
    let initials = session.user.email[0]
    if (session.user.firstname && session.user.surname) {
        initials = session.user.firstname[0] + session.user.surname[0]
    } else if (session.user.firstname) {
        initials = session.user.firstname[0]
    } else if (session.user.name) {
        initials = session.user.name[0]
    }

    // Determine userName
    const userName = session.user.firstname ?? session.user.name

    // Expand session
    const sessionWithUserName = {
        ...session,
        userName: userName,
        principal_id: session.user.id,
        initials: initials,
    }

    return sessionWithUserName
}

interface FdmSession {
    session: Session
    user: User
    userName: string
    principal_id: string
    initials: string
}
