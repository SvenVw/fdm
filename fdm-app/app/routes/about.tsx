/**
 * @file This file defines the layout and data loading for the `/about` section of the application.
 *
 * It establishes a common layout that includes a sidebar for navigation within the "about"
 * pages (like "What's New"). The loader ensures that only authenticated users can access
 * this section and provides the necessary user data to the components.
 *
 * @packageDocumentation
 */
import posthog from "posthog-js"
import { useEffect } from "react"
import type { LoaderFunctionArgs } from "react-router"
import { redirect, useLoaderData } from "react-router"
import { Outlet } from "react-router-dom"
import { SidebarPlatform } from "~/components/blocks/sidebar/platform"
import { SidebarSupport } from "~/components/blocks/sidebar/support"
import { SidebarTitle } from "~/components/blocks/sidebar/title"
import { SidebarUser } from "~/components/blocks/sidebar/user"
import {
    Sidebar,
    SidebarContent,
    SidebarInset,
    SidebarProvider,
} from "~/components/ui/sidebar"
import { checkSession, getSession } from "~/lib/auth.server"
import { clientConfig } from "~/lib/config"
import { handleLoaderError } from "~/lib/error"

/**
 * The loader for the `/about` routes.
 *
 * This function protects the route by ensuring a valid user session exists. It fetches
 * the session data and performs a `checkSession` to handle unauthenticated users or
 * users with incomplete profiles, redirecting them if necessary.
 *
 * @param request - The incoming `Request` object.
 * @returns An object containing the user's data (`user`, `userName`, `initials`).
 * @throws {Response} A redirect response if the user is not authenticated or if their
 *   profile is incomplete. Throws other errors to be handled by the error boundary.
 */
export async function loader({ request }: LoaderFunctionArgs) {
    try {
        const session = await getSession(request)
        const sessionCheckResponse = await checkSession(session, request)
        if (sessionCheckResponse instanceof Response) {
            return sessionCheckResponse
        }

        return {
            user: session.user,
            userName: session.userName,
            initials: session.initials,
        }
    } catch (error) {
        if (error instanceof Response && error.status === 401) {
            const currentPath = new URL(request.url).pathname
            const signInUrl = `/signin?redirectTo=${encodeURIComponent(currentPath)}`
            return redirect(signInUrl)
        }
        throw handleLoaderError(error)
    }
}

/**
 * The layout component for the `/about` section.
 *
 * It renders a consistent sidebar navigation and a main content area where
 * nested routes are displayed via the `Outlet` component. It also handles
 * identifying the user for PostHog analytics on the client-side.
 */
export default function AboutLayout() {
    const loaderData = useLoaderData<typeof loader>()

    // Identify the user in PostHog once the user data is available.
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
