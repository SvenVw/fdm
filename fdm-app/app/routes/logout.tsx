import { auth } from "@/lib/auth.server";
import { ActionFunctionArgs, redirect } from "react-router";

export async function action({
    request,
}: ActionFunctionArgs) {
    try {
        // Get the session token
        const session = await auth.api.getSession({
            headers: request.headers
        })

        // Revoke the session
        await auth.api.revokeSession({
            headers: request.headers,
            body: {
                token: session?.session.token
            }
        })

        return redirect("/signin", {
            headers: {
                "Clear-Site-Data": '"cache", "cookies", "storage"',
                "Cache-Control": "no-store, no-cache, must-revalidate"
            }
        })
    } catch (error) {
        console.error("Logout failed:", error);
        return redirect("/signin");
    }
}