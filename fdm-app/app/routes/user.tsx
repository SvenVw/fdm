/**
 * @file This file serves as the layout component for all user-related routes.
 * It handles session validation, loads user data for the sidebar, and renders the nested routes.
 * @copyright 2023 Batavi
 * @license MIT
 */
import posthog from "posthog-js"
import { useEffect } from "react"
import type { LoaderFunctionArgs } from "react-router"
import { useLoaderData } from "react-router"
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
 * Loads data for the user layout.
 *
 * This function ensures the user is authenticated and fetches their session data.
 * If the user is not logged in, it redirects them to the sign-in page.
 *
 * @param request - The incoming request object.
 * @returns An object containing the user's session data.
 * @throws {Response} A redirect response if the session is invalid.
 */
export async function loader({ request }: LoaderFunctionArgs) {
    try {
        // Get the session
        const session = await getSession(request)
        const sessionCheckResponse = await checkSession(session, request)
        // If checkSession returns a Response, it means a redirect is needed
        if (sessionCheckResponse instanceof Response) {
            return sessionCheckResponse
        }

        // Return user information from loader
        return {
            user: session.user,
            userName: session.userName,
            initials: session.initials,
        }
    } catch (error) {
        throw handleLoaderError(error)
    }
}

/**
 * Renders the layout for the user section.
 *
 * This component sets up the main structure with a sidebar and a content area
 * for user-specific pages. It also initializes PostHog for analytics if enabled.
 *
 * @returns The JSX for the user layout.
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
