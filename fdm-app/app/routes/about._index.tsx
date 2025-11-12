/**
 * @file This file defines the loader for the index route (`/about`) of the "about" section.
 *
 * Its sole purpose is to redirect users from the base `/about` URL to the `/about/whats-new`
 * page, ensuring there is no empty index page in this section.
 *
 * @packageDocumentation
 */
import { redirect } from "react-router"

/**
 * The loader for the `/about` index route.
 * @returns A `Response` object that performs a redirect to the "What's New" page.
 */
export async function loader() {
    return redirect("./whats-new")
}
