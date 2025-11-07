/**
 * @file This file is responsible for all server-side authentication and session management.
 *
 * It initializes the `@svenvw/fdm-core` authentication system (`FdmAuth`), which is built
 * on top of `better-auth`. It configures authentication providers (Google, Microsoft, Magic Link)
 * and extends the default behavior, for instance, by sending a welcome email upon user sign-up.
 *
 * It also provides utility functions for retrieving and validating user sessions, which are
 * used in Remix loaders to protect routes and ensure user profiles are complete.
 *
 * @packageDocumentation
 */
import {
    createDisplayUsername,
    createFdmAuth,
    type FdmAuth,
} from "@svenvw/fdm-core"
import type { GenericEndpointContext, Session } from "better-auth"
import { redirect } from "react-router"
import { fdm } from "~/lib/fdm.server"
import type { ExtendedUser } from "~/types/extended-user"
import { serverConfig } from "./config.server"
import {
    renderWelcomeEmail,
    sendEmail,
    sendMagicLinkEmailToUser,
} from "./email.server"

/**
 * The singleton instance of the FDM authentication client, configured for server-side use.
 */
export const auth: FdmAuth = createFdmAuth(
    fdm,
    serverConfig.auth.google,
    serverConfig.auth.microsoft,
    sendMagicLinkEmailToUser,
)

// Extend the `user.create.after` database hook to send a welcome email.
if (serverConfig.mail) {
    const originalUserCreateAfter =
        auth.options.databaseHooks?.user?.create?.after
    auth.options.databaseHooks = {
        ...auth.options.databaseHooks,
        user: {
            ...auth.options.databaseHooks?.user,
            create: {
                ...auth.options.databaseHooks?.user?.create,
                after: async (
                    user: ExtendedUser,
                    context?: GenericEndpointContext,
                ) => {
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

/**
 * Represents the enriched user session object used throughout the FDM application.
 */
interface FdmSession {
    session: Session
    user: ExtendedUser
    /** The user's full name for display purposes. */
    userName: string
    /** The user's ID, used as the principal identifier. */
    principal_id: string
    /** The user's initials for use in avatars. */
    initials: string
}

/**
 * Retrieves the current user session from an incoming request.
 *
 * This function authenticates the request and enriches the session object with
 * additional user details like `userName`, `principal_id`, and `initials`.
 *
 * @param request - The incoming `Request` object.
 * @returns A promise that resolves to the enriched `FdmSession`.
 * @throws {Response} Throws a 401 Unauthorized response if the session is invalid or missing.
 */
export async function getSession(request: Request): Promise<FdmSession> {
    const session = await auth.api.getSession({
        headers: request.headers,
    })

    if (!session) {
        throw new Response("Unauthorized", { status: 401 })
    }

    const user = session.user as ExtendedUser

    let initials = user.email[0]
    if (user.firstname && user.surname) {
        initials = user.firstname[0] + user.surname[0]
    } else if (user.firstname) {
        initials = user.firstname[0]
    } else if (user.name) {
        initials = user.name[0]
    }

    const displayUserName =
        user.displayUsername || createDisplayUsername(user.firstname, user.surname)

    return {
        ...session,
        userName: displayUserName,
        principal_id: user.id,
        initials: initials,
    }
}

/**
 * Checks the validity of a session and ensures the user's profile is complete.
 *
 * This function is a route guard. It should be called at the beginning of loaders
 * for protected routes.
 *
 * - If the user is not authenticated, it redirects to the `/signin` page.
 * - If the user is authenticated but has not completed their profile (i.e., missing
 *   firstname or surname), it redirects to the `/welcome` page.
 *
 * @param session - The `FdmSession` object to check.
 * @param request - The incoming `Request` object, used to preserve the original URL upon redirect.
 * @returns A `Response` object for redirection if the session is invalid or incomplete,
 *   otherwise `undefined`.
 */
export async function checkSession(
    session: FdmSession,
    request: Request,
): Promise<undefined | Response> {
    if (!session?.user) {
        const currentPath = new URL(request.url).pathname
        const signInUrl = `/signin?redirectTo=${encodeURIComponent(currentPath)}`
        return redirect(signInUrl)
    }

    if (!session.user.firstname || !session.user.surname) {
        const currentPath = new URL(request.url).pathname
        const welcomeUrl = `/welcome?redirectTo=${encodeURIComponent(currentPath)}`
        return redirect(welcomeUrl)
    }
}
