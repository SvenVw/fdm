/**
 * @file This file defines a health check endpoint for the application.
 * It can be used by monitoring services to verify that the application is running.
 * @copyright 2023 Batavi
 * @license MIT
 */
import type { LoaderFunctionArgs } from "react-router"

/**
 * Handles GET requests to the health check endpoint.
 *
 * This function performs basic health checks to ensure the application is operational.
 * It returns a 200 OK response if the checks pass, or a 503 Service Unavailable
 * response if any checks fail.
 *
 * @param request - The incoming request object.
 * @returns A response indicating the health status of the application.
 */
export async function loader({ request }: LoaderFunctionArgs) {
    // Add basic health checks here
    try {
        // Add any critical service checks here

        return new Response("OK", {
            status: 200,
            headers: {
                "Content-Type": "text/plain",
            },
        })
    } catch (error) {
        console.error("Health check failed:", error)
        return new Response("Service Unavailable", {
            status: 503,
            headers: {
                "Content-Type": "text/plain",
            },
        })
    }
}
