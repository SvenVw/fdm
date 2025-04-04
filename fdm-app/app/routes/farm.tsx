import posthog from "posthog-js"
import { useEffect } from "react"
import type {
    ActionFunctionArgs,
    LoaderFunctionArgs,
    MetaFunction,
} from "react-router"
import { redirect, useRoutes } from "react-router"
import { useLoaderData, useMatches } from "react-router"
import { Outlet } from "react-router-dom"
import { SidebarApp } from "~/components/custom/sidebar-app"
import { SidebarProvider } from "~/components/ui/sidebar"
import { SidebarInset } from "~/components/ui/sidebar"
import { auth, getSession } from "~/lib/auth.server"
import { clientConfig } from "~/lib/config"
import { handleActionError, handleLoaderError } from "~/lib/error"
import { useCalendarStore } from "~/store/calendar"
import { useFarmStore } from "~/store/farm"
import Account from "./farm.account"
import WhatsNew from "./farm.whats-new"

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
            return redirect("/signin")
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

    const routes = useRoutes([
        {
            path: "/farm/whats-new",
            element: <WhatsNew />,
        },
        {
            path: "/farm/account",
            element: <Account />,
        },
        {
            path: "*",
            element: <Outlet />,
        },
    ])

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
            <SidebarApp
                user={loaderData.user}
                userName={loaderData.userName}
                initials={loaderData.initials}
            />
            <SidebarInset>
                <Outlet />
                {routes}
            </SidebarInset>
        </SidebarProvider>
    )
}

/**
 * Revokes the user session and redirects to the sign-in page.
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
        await auth.api.revokeSession({
            headers: request.headers,
            body: {
                token: session?.session.token,
            },
        })
        return redirect("/signin")
    } catch (error) {
        throw handleActionError(error)
    }
}
