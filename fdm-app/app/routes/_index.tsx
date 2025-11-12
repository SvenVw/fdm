/**
 * @file This file defines the loader for the root route (`/`) of the application.
 *
 * Its sole purpose is to redirect all traffic from the root URL to the `/signin` page,
 * ensuring that unauthenticated users are always prompted to log in.
 *
 * @packageDocumentation
 */
import { redirect } from "react-router"

/**
 * The loader for the root route.
 * @returns A `Response` object that performs a redirect to the sign-in page.
 */
export async function loader() {
    return redirect("./signin")
}
