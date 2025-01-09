import { auth } from "@/lib/auth.server";
import { ActionFunctionArgs, redirect } from "react-router";

export async function action({
    request,
}: ActionFunctionArgs) {

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

    return redirect("/signin")
}