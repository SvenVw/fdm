/**
 * @file This file handles the verification of magic links for authentication.
 * It validates the token and redirects the user to the appropriate page.
 * @copyright 2023 Batavi
 * @license MIT
 */
import { redirect } from "react-router"
import { auth } from "~/lib/auth.server"
import { handleLoaderError } from "~/lib/error"

/**
 * Handles the magic link verification process.
 *
 * This function is triggered when a user clicks a magic link. It verifies the token,
 * handles invalid or expired tokens, and redirects the user to their intended
 * destination upon successful authentication.
 *
 * @param request - The incoming request object, containing the magic link URL.
 * @returns A redirect response to the callback URL on success, or to an error page on failure.
 * @throws {Error} If an unexpected error occurs during the process.
 */
export async function loader({ request }: { request: Request }) {
    const url = new URL(request.url)
    const callbackUrlParam = url.searchParams.get("callbackUrl") || "/farm"

    // Validate callback URL to prevent open redirects
    const callbackUrl =
        callbackUrlParam.startsWith("/") ||
        callbackUrlParam.startsWith(url.origin)
            ? callbackUrlParam
            : "/farm"

    try {
        // Delegate to better-auth's handler for verification and session creation
        const authResponse = await auth.handler(request)

        // Check if token is valid
        const location = String(authResponse.headers.get("location"))
        if (!location) {
            throw new Error("No location header")
        }
        if (
            location.match(/INVALID_TOKEN/) ||
            location.match(/EXPIRED_TOKEN/)
        ) {
            return redirect("/signin/invalid_token")
        }

        // Redirect to callback page and set session cookie
        return redirect(callbackUrl, {
            headers: new Headers(authResponse.headers),
        })
    } catch (error) {
        throw handleLoaderError(error)
    }
}
