import { createFdmAuth } from "@svenvw/fdm-core"
import type { Session, User } from "better-auth"
import { fdm } from "~/lib/fdm.server"
import type { GenericEndpointContext } from "better-auth"

// Initialize better-auth instance for FDM
export const auth = createFdmAuth(fdm)

function sendWelcomeEmail(user: Session) {
    console.log("Sending welcome email")
    console.log(user)
}

// Extend database hooks with sending a welcome email after sign up
const originalUserCreateAfter =
    auth.options.databaseHooks?.session?.create?.after
auth.options.databaseHooks = {
    ...auth.options.databaseHooks,
    session: {
        ...auth.options.databaseHooks?.session,
        create: {
            ...auth.options.databaseHooks?.session?.create,
            after: async (user, context?: GenericEndpointContext) => {
                if (originalUserCreateAfter) {
                    await originalUserCreateAfter(user, context)
                }
                await sendWelcomeEmail(user)
            },
        },
    },
}

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
    let userName = session.user.name
    if (session.user.firstname && session.user.surname) {
        userName = `${session.user.firstname} ${session.user.surname}`
    } else if (session.user.firstname) {
        userName = session.user.firstname
    }

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
