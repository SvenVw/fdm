import * as Sentry from "@sentry/react-router"
import { isRouteErrorResponse, redirect, useLocation } from "react-router"
import type { Route } from "../../+types/root"
import { ErrorBlock } from "./error"

/**
 * Renders an error boundary that handles and displays error information based on the provided error.
 *
 * This component distinguishes between route error responses and generic errors:
 * - For route errors:
 *   - Redirects to the signin page if the error status is 401.
 *   - Renders a 404 error block for client errors with status 400, 403, or 404.
 *   - Logs other route errors to the error tracking service and renders an error block reflecting the specific status.
 * - For generic Error instances, it logs the error and renders a 500 error block with the error message and stack trace.
 * - If the error is null, no error UI is rendered.
 * - For any other cases, it logs the error and displays an error block with a 500 status and a generic message.
 *
 * @param error - The error encountered during route processing, either as a route error response or a generic Error.
 */
export function InlineErrorBoundary({ error }: Route.ErrorBoundaryProps) {
    const location = useLocation()
    const page = location.pathname
    const timestamp = new Date().toISOString()

    if (isRouteErrorResponse(error)) {
        // Redirect to signin page if authentication is not provided
        if (error.status === 401) {
            // Get the current path the user tried to access
            const currentPath =
                location.pathname + location.search + location.hash
            // Construct the sign-in URL with the redirectTo parameter
            const signInUrl = `./signin?redirectTo=${encodeURIComponent(currentPath)}`
            // Throw the redirect response to be caught by React Router
            throw redirect(signInUrl)
        }

        const clientErrors = [400, 403, 404]
        if (clientErrors.includes(error.status)) {
            return (
                <ErrorBlock
                    status={404} // Show 404 in case user is not authorized to access page
                    message={error.statusText}
                    stacktrace={error.data}
                    page={page}
                    timestamp={timestamp}
                />
            )
        }

        Sentry.captureException(error)
        return (
            <ErrorBlock
                status={error.status}
                message={error.statusText}
                stacktrace={error.data}
                page={page}
                timestamp={timestamp}
            />
        )
    }
    if (error instanceof Error) {
        Sentry.captureException(error)
        return (
            <ErrorBlock
                status={500}
                message={error.message}
                stacktrace={error.stack}
                page={page}
                timestamp={timestamp}
            />
        )
    }
    if (error === null) {
        return null
    }

    Sentry.captureException(error)
    return (
        <ErrorBlock
            status={500}
            message="Unknown Error"
            stacktrace={null}
            page={page}
            timestamp={timestamp}
        />
    )
}
