import posthog from "posthog-js"
import { useEffect } from "react"
import type { LoaderFunctionArgs } from "react-router"
import { redirect } from "react-router"
import { useLoaderData } from "react-router"
import { Outlet } from "react-router-dom"
import {
    Sidebar,
    SidebarContent,
    SidebarProvider,
} from "~/components/ui/sidebar"
import { SidebarInset } from "~/components/ui/sidebar"
import { getSession } from "~/lib/auth.server"
import { clientConfig } from "~/lib/config"
import { handleLoaderError } from "~/lib/error"
import { SidebarTitle } from "~/components/custom/sidebar/title"
import { SidebarSupport } from "~/components/custom/sidebar/support"
import { SidebarUser } from "~/components/custom/sidebar/user"
import { SidebarPlatform } from "@/app/components/custom/sidebar/platform"

/**
 * Retrieves the session from the HTTP request and returns user information if available.
 *
 * If the session does not contain a user, the function redirects to the "/signin" route.
 * Any errors encountered during session retrieval are processed by the designated error handler.
 *
 * @param request - The HTTP request used for obtaining session data.
 * @returns An object with a "user" property when a valid session is found.
 *
 * @throws {Error} If an error occurs during session retrieval, processed by handleLoaderError.
 */
export async function loader({ request }: LoaderFunctionArgs) {
    try {
        // Get the session
        const session = await getSession(request)

        if (!session?.user) {
            // Get the original URL the user tried to access
            const currentPath = new URL(request.url).pathname
            // Construct the sign-in URL with the redirectTo parameter
            const signInUrl = `/signin?redirectTo=${encodeURIComponent(currentPath)}`
            // Perform the redirect
            return redirect(signInUrl)
        }

        // Return user information from loader
        return {
            user: session.user,
            userName: session.userName,
            initials: session.initials,
        }
    } catch (error) {
        // If getSession throws (e.g., invalid token), it might result in a 401
        // We need to handle that case here as well, similar to the ErrorBoundary
        if (error instanceof Response && error.status === 401) {
            const currentPath = new URL(request.url).pathname
            const signInUrl = `/signin?redirectTo=${encodeURIComponent(currentPath)}`
            return redirect(signInUrl)
        }
        // Re-throw other errors to be handled by the ErrorBoundary or default handling
        throw handleLoaderError(error)
    }
}

/**
 * Renders the main application layout.
 *
 * This component retrieves user data from the loader using React Router's useLoaderData hook and passes it to the SidebarApp component within a SidebarProvider context. It also renders an Outlet to display nested routes.
 */
export default function App() {
    const loaderData = useLoaderData<typeof loader>()

    // Identify user if PostHog is configured
    useEffect(() => {
        if (clientConfig.analytics.posthog && loaderData.user) {
            posthog.identify(loaderData.user.id, {
                id: loaderData.user.id,
                email: loaderData.user.email,
                name: loaderData.user.name,
            })
        }
    }, [loaderData.user])

    return (
        <SidebarProvider>
            <Sidebar>
                <SidebarTitle />
                <SidebarContent>
                    <SidebarPlatform />
                </SidebarContent>
                <SidebarSupport
                    name={loaderData.userName}
                    email={loaderData.user.email}
                />
                <SidebarUser
                    name={loaderData.userName}
                    email={loaderData.user.email}
                    image={loaderData.user.image}
                    avatarInitials={loaderData.initials}
                    userName={loaderData.userName}
                />
            </Sidebar>
            <SidebarInset>
                <Outlet />
            </SidebarInset>
        </SidebarProvider>
    )
}
