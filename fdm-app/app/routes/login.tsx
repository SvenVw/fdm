import { redirect } from "@remix-run/node"

import type { LoaderFunction } from "@remix-run/node";

export const loader: LoaderFunction = async () => {
    try {
        // Temporary until iam is completed
        return redirect("/signup");
    } catch (error) {
        console.error("Login redirect failed:", error);
        throw error;
    }
}