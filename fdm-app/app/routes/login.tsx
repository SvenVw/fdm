import { data, redirect } from "react-router";

import type { LoaderFunction } from "react-router";

export const loader: LoaderFunction = async () => {
    try {
        // Temporary until iam is completed
        return redirect("/signup");
    } catch (error) {
        console.error("Login redirect failed:", error);
        throw data("Login redirect failed", {
            status: 500,
            statusText: "Login redirect failed",
        });
    }
}