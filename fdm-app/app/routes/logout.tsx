/**
 * @file This file handles the user logout process.
 * It provides an action function that revokes the user's session and redirects them to the sign-in page.
 * @copyright 2023 Batavi
 * @license MIT
 */
import { type ActionFunctionArgs, redirect } from "react-router"
import { auth, getSession } from "~/lib/auth.server"
import { handleActionError } from "~/lib/error"

/**
 * Handles the POST request to log a user out.
 *
 * This function retrieves the current session from the provided HTTP request and attempts to revoke it through the
 * authentication API. On successful revocation, it returns a redirect response to the sign-in route. Any error during
 * session retrieval or revocation is caught, processed by the error handler, and re-thrown.
 *
 * @param request - The HTTP request containing session and header data.
 * @returns A redirect response to the sign-in page.
 *
 * @throws {Error} If an error occurs while retrieving or revoking the session.
 */
export async function action({ request }: ActionFunctionArgs) {
    try {
        // Get the session
        const session = await getSession(request)

        // Revoke the session
        // Revoke the session
        await auth.api.revokeSession({
            headers: request.headers,
            body: {
                token: session?.session?.token || undefined,
            },
        })
        return redirect("/signin")
    } catch (error) {
        throw handleActionError(error)
    }
}
