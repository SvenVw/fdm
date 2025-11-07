/**
 * @file This file serves as the layout component for all organization-related routes.
 * It handles session validation, data loading for the sidebar and header, and renders the nested routes.
 * @copyright 2023 Batavi
 * @license MIT
 */
import { getOrganizationsForUser } from "@svenvw/fdm-core"
import posthog from "posthog-js"
import { useEffect } from "react"
import type { LoaderFunctionArgs } from "react-router"
import { redirect, useLoaderData } from "react-router"
import { Outlet } from "react-router-dom"
import { Header } from "~/components/blocks/header/base"
import { HeaderOrganization } from "~/components/blocks/header/organization"
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
import { fdm } from "~/lib/fdm.server"

/**
 * Loads data for the organization layout.
 *
 * This function ensures the user is authenticated, fetches the user's data,
 * and retrieves the list of organizations they belong to. It also identifies
 * the currently selected organization from the route parameters.
 *
 * @param request - The incoming request object.
 * @param params - The route parameters.
 * @returns An object containing user data, organization list, and selected organization slug.
 * @throws {Response} A redirect response to the sign-in page if the user is not authenticated.
 */
export async function loader({ request, params }: LoaderFunctionArgs) {
    try {
        // Get the session
        const session = await getSession(request)
        const sessionCheckResponse = await checkSession(session, request)
        // If checkSession returns a Response, it means a redirect is needed
        if (sessionCheckResponse instanceof Response) {
            return sessionCheckResponse
        }
        const selectedOrganizationSlug = params.slug

        const organizations = await getOrganizationsForUser(
            fdm,
            session.user.id,
        )

        // Return user information from loader
        return {
            user: session.user,
            userName: session.userName,
            initials: session.initials,
            selectedOrganizationSlug: selectedOrganizationSlug,
            organizations: organizations,
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
 * Renders the layout for the organization section.
 *
 * This component sets up the main structure with a sidebar and a content area.
 * It initializes PostHog for analytics if configured and renders the nested
 * route components through the Outlet.
 *
 * @returns The JSX for the organization layout.
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
                <Header action={undefined}>
                    <HeaderOrganization
                        selectedOrganizationSlug={
                            loaderData.selectedOrganizationSlug
                        }
                        organizationOptions={loaderData.organizations}
                    />
                </Header>
                <Outlet />
            </SidebarInset>
        </SidebarProvider>
    )
}
