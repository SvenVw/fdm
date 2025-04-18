import posthog from "posthog-js"
import { useEffect } from "react"
import type {
    ActionFunctionArgs,
    LoaderFunctionArgs,
    MetaFunction,
} from "react-router"
import { redirect, Route, Routes } from "react-router"
import { useLoaderData, useMatches } from "react-router"
import { Outlet } from "react-router-dom"
import {
    Sidebar,
    SidebarContent,
    SidebarProvider,
} from "~/components/ui/sidebar"
import { SidebarInset } from "~/components/ui/sidebar"
import { auth, getSession } from "~/lib/auth.server"
import { clientConfig } from "~/lib/config"
import { handleActionError, handleLoaderError } from "~/lib/error"
import { useCalendarStore } from "~/store/calendar"
import { useFarmStore } from "~/store/farm"
import Account from "./user._index"
import About from "./about"
import { SidebarTitle } from "~/components/custom/sidebar/title"
import { SidebarFarm } from "~/components/custom/sidebar/farm"
import { SidebarApps } from "~/components/custom/sidebar/apps"
import { SidebarSupport } from "~/components/custom/sidebar/support"
import { SidebarUser } from "~/components/custom/sidebar/user"

export const meta: MetaFunction = () => {
    return [
        { title: `Dashboard | ${clientConfig.name}` },
        {
            name: "description",
            content:
                "Beheer je bedrijfsgegevens, percelen en gewassen in één overzichtelijk dashboard.",
        },
    ]
}

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
    const matches = useMatches()
    const farmMatch = matches.find(
        (match) =>
            match.pathname.startsWith("/farm/") && match.params.b_id_farm,
    )
    const initialFarmId = farmMatch?.params.b_id_farm as string | undefined
    const setFarmId = useFarmStore((state) => state.setFarmId)

    useEffect(() => {
        setFarmId(initialFarmId)
    }, [initialFarmId, setFarmId])

    const routes = (
        <Routes>
            <Route path="about" element={<About />} />
            <Route path="account" element={<Account />} />
            <Route path="*" element={<Outlet />} />
        </Routes>
    )

    const calendarMatch = matches.find(
        (match) => match.pathname.startsWith("/farm/") && match.params.calendar,
    )
    const initialCalendar = calendarMatch?.params.calendar as string | undefined
    const setCalendar = useCalendarStore((state) => state.setCalendar)

    useEffect(() => {
        setCalendar(initialCalendar)
    }, [initialCalendar, setCalendar])

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
                    <SidebarFarm />
                    <SidebarApps />
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
                {routes}
            </SidebarInset>
        </SidebarProvider>
    )
}
