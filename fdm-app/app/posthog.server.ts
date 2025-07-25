import { PostHog } from "posthog-node"

let posthogClient: PostHog | null = null

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
