import { createFdmAuth, type BetterAuth } from "@svenvw/fdm-core" // Import BetterAuth
import type { Session, User as BetterAuthUser } from "better-auth"
import type { GenericEndpointContext } from "better-auth"
import { fdm } from "~/lib/fdm.server"
import { serverConfig } from "./config.server"
import { renderWelcomeEmail, sendEmail, sendMagicLinkEmailToUser } from "./email.server"
import type { ExtendedUser } from "~/types/extended-user"

// Initialize better-auth instance for FDM
export const auth: BetterAuth = createFdmAuth(
    fdm,
    serverConfig.auth.google,
    serverConfig.auth.microsoft,
    sendMagicLinkEmailToUser,
)

// Extend database hooks with sending a welcome email after sign up
if (serverConfig.mail) {
    const originalUserCreateAfter =
        auth.options.databaseHooks?.user?.create?.after
    auth.options.databaseHooks = {
        ...auth.options.databaseHooks,
        user: {
            ...auth.options.databaseHooks?.user,
            create: {
                ...auth.options.databaseHooks?.user?.create,
                after: async (user: ExtendedUser, context?: GenericEndpointContext) => {
                    if (originalUserCreateAfter) {
                        await originalUserCreateAfter(user, context)
                    }
                    try {
                        const email = await renderWelcomeEmail(user)
                        await sendEmail(email)
                    } catch (error) {
                        console.error("Error sending welcome email:", error)
                    }
                },
            },
        },
    }
}

// Get the session
export async function getSession(request: Request): Promise<FdmSession> {
    const session = await auth.api.getSession({
        headers: request.headers,
    })

    if (!session) {
        throw new Response("Unauthorized", { status: 401 })
    }

    // Cast session.user to ExtendedUser for type safety
    const user = session.user as ExtendedUser;

    // Determine avatar initials
    let initials = user.email[0]
    if (user.firstname && user.surname) {
        initials = user.firstname[0] + user.surname[0]
    } else if (user.firstname) {
        initials = user.firstname[0]
    } else if (user.name) {
        initials = user.name[0]
    }

    // Determine userName
    let userName = user.name
    if (user.firstname && user.surname) {
        userName = `${user.firstname} ${user.surname}`
    } else if (user.firstname) {
        userName = user.firstname
    }

    // Expand session
    const sessionWithUserName = {
        ...session,
        userName: userName,
        principal_id: user.id,
        initials: initials,
    }

    return sessionWithUserName
}

interface FdmSession {
    session: Session
    user: ExtendedUser
    userName: string
    principal_id: string
    initials: string
}
