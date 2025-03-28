import { PostHog } from "posthog-node"

let posthogClient: PostHog | null = null

export default function PostHogClient() {
    if (!posthogClient) {
        const posthogHost = process.env.VITE_PUBLIC_POSTHOG_HOST
        const posthogKey = process.env.VITE_PUBLIC_POSTHOG_KEY
        if (posthogHost && posthogKey?.startsWith("phc")) {
            posthogClient = new PostHog(posthogKey, {
                host: posthogHost,
            })
        }
    }
    return posthogClient
}
