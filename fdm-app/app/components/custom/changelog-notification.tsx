/**
 * @file This file defines the `ChangelogNotification` component, which is responsible
 * for alerting users to new updates or features in the application.
 *
 * @packageDocumentation
 */
import { ArrowRight, Circle, X } from "lucide-react"
import { NavLink } from "react-router"
import { Button } from "~/components/ui/button"
import { useChangelogStore } from "~/store/changelog"

/**
 * A notification component that appears when new changelog updates are available.
 *
 * This component subscribes to the `useChangelogStore` to determine if there are
 * unseen updates. If there are, it renders a banner with the title of the latest
 * update.
 *
 * The banner is a link that navigates the user to the "What's New" page. It also
 * includes a dismiss button that calls `markAllAsSeen` to hide the notification
 * until the next new update.
 */
export function ChangelogNotification() {
    const { hasNewUpdates, latestUpdateTitle, markAllAsSeen } =
        useChangelogStore()

    if (!hasNewUpdates || !latestUpdateTitle) {
        return null
    }

    return (
        <div className="flex items-center justify-between gap-2 rounded-md border border-muted-foreground/20 bg-background p-2 text-sm shadow-sm transition-colors hover:border-primary">
            <NavLink
                to="/about/whats-new"
                className="flex grow items-center gap-2"
            >
                <Circle className="h-4 w-4 text-blue-400 fill-blue-400" />
                <span className="font-medium text-shadow-muted-foregroundforeground">
                    {latestUpdateTitle}
                </span>
                <ArrowRight className="h-4 w-4" />
            </NavLink>
            <Button
                variant="ghost"
                size="icon"
                onClick={markAllAsSeen}
                className="h-6 w-6 text-muted-foreground hover:bg-muted-foreground/20"
                aria-label="Dismiss new update notification"
            >
                <X className="h-4 w-4" />
            </Button>
        </div>
    )
}
