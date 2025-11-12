/**
 * @file This module provides a server-side singleton instance of the PostHog client.
 *
 * It ensures that the PostHog client is initialized only once per server instance,
 * using environment variables for configuration. This client can be used in Remix
 * loaders and actions to send analytics events from the backend.
 *
 * @packageDocumentation
 */
import { PostHog } from "posthog-node"

let posthogClient: PostHog | null = null

/**
 * Initializes and returns a singleton instance of the server-side PostHog client.
 *
 * This function checks if the PostHog client has already been initialized. If not,
 * it reads the `PUBLIC_POSTHOG_HOST` and `PUBLIC_POSTHOG_KEY` from the environment
 * variables and creates a new `PostHog` instance.
 *
 * If the required environment variables are not set, it returns `null`.
 *
 * @returns An initialized `PostHog` client instance, or `null` if configuration is missing.
 */
export default function PostHogClient(): PostHog | null {
    if (!posthogClient) {
        const posthogHost = process.env.PUBLIC_POSTHOG_HOST
        const posthogKey = process.env.PUBLIC_POSTHOG_KEY
        if (posthogHost && posthogKey?.startsWith("phc")) {
            posthogClient = new PostHog(posthogKey, {
                host: posthogHost,
            })
        }
    }
    return posthogClient
}
