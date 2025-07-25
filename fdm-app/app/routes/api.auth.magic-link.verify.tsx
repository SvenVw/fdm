import { redirect } from "react-router"
import { auth } from "~/lib/auth.server"
import { handleLoaderError } from "~/lib/error"

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
