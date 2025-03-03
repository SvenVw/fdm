import type {
    ActionFunctionArgs,
    LoaderFunctionArgs,
    MetaFunction,
} from "react-router"
import { redirect } from "react-router"
import { Outlet, useLoaderData } from "react-router"
import { SidebarApp } from "@/components/custom/sidebar-app"
import { SidebarProvider } from "@/components/ui/sidebar"
import { auth, getSession } from "@/lib/auth.server"
import { handleActionError } from "@/lib/error"

export const meta: MetaFunction = () => {
    return [
        { title: "FDM App" },
        { name: "description", content: "Welcome to FDM!" },
    ]
}

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
        }
    } catch (error) {
        throw handleLoaderError(error)
    }
}

export default function App() {
    const loaderData = useLoaderData<typeof loader>()

    return (
        <SidebarProvider>
            <SidebarApp user={loaderData.user} />
            <Outlet />
        </SidebarProvider>
    )
}

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
