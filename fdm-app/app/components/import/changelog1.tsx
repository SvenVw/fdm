/**
 * @file This file defines a `Changelog1` component, which is a UI block for
 * displaying a chronological list of updates or changes.
 *
 * This component is designed to render a series of changelog entries in a visually
 * appealing timeline format. It was imported from `shadcnblocks`.
 *
 * @see https://www.shadcnblocks.com/block/changelog1
 * @packageDocumentation
 */
import { ArrowUpRight } from "lucide-react"
import { NavLink } from "react-router"
import { Badge } from "~/components/ui/badge"
import { Button } from "~/components/ui/button"

/**
 * Represents a single entry in the changelog.
 */
export type ChangelogEntry = {
    /** The version number for the update (e.g., "v1.2.0"). */
    version: string
    /** The date of the update (e.g., "March 2024"). */
    date: string
    /** The main title of the changelog entry. */
    title: string
    /** A detailed description of the changes. */
    description: string
    /** An optional list of specific changes or bullet points. */
    items?: string[]
    /** An optional URL to an image showcasing the update. */
    image?: string
    /** An optional call-to-action button. */
    button?: {
        url: string
        text: string
    }
}

export interface Changelog1Props {
    /** The main title of the changelog page. */
    title?: string
    /** A subtitle or brief description for the changelog page. */
    description?: string
    /** An array of changelog entries to display. */
    entries?: ChangelogEntry[]
    /** Additional CSS classes for custom styling. */
    className?: string
}

/** An empty array to be used as a default for the `entries` prop. */
export const defaultEntries: ChangelogEntry[] = []

/**
 * A component for displaying a changelog or a list of updates in a timeline format.
 *
 * It iterates over a list of `ChangelogEntry` objects and renders each one with its
 * version, date, title, description, and optional details like a feature list,
 * image, and a link button.
 */
const Changelog1 = ({
    title = "Changelog",
    description = "Get the latest updates and improvements to our platform.",
    entries = defaultEntries,
}: Changelog1Props) => {
    return (
        <section className="py-32">
            <div className="container">
                <div className="mx-auto max-w-3xl">
                    <h1 className="mb-4 text-3xl font-bold tracking-tight md:text-5xl">
                        {title}
                    </h1>
                    <p className="mb-6 text-base text-muted-foreground md:text-lg">
                        {description}
                    </p>
                </div>
                <div className="mx-auto mt-16 max-w-3xl space-y-16 md:mt-24 md:space-y-24">
                    {entries.map((entry) => (
                        <div
                            key={`${entry.version}-${entry.date}`}
                            className="relative flex flex-col gap-4 md:flex-row md:gap-16"
                        >
                            <div className="top-8 flex h-min w-64 shrink-0 items-center gap-4 md:sticky">
                                <Badge variant="secondary" className="text-xs">
                                    {entry.version}
                                </Badge>
                                <span className="text-xs font-medium text-muted-foreground">
                                    {entry.date}
                                </span>
                            </div>
                            <div className="flex flex-col">
                                <h2 className="mb-3 text-lg leading-tight font-bold text-foreground/90 md:text-2xl">
                                    {entry.title}
                                </h2>
                                <p className="text-sm text-muted-foreground md:text-base">
                                    {entry.description}
                                </p>
                                {entry.items && entry.items.length > 0 && (
                                    <ul className="mt-4 ml-4 space-y-1.5 text-sm text-muted-foreground md:text-base">
                                        {entry.items.map((item, itemIndex) => (
                                            <li
                                                key={`${entry.version}-item-${itemIndex}`}
                                                className="list-disc"
                                            >
                                                {item}
                                            </li>
                                        ))}
                                    </ul>
                                )}
                                {entry.image && (
                                    <img
                                        src={entry.image}
                                        alt={`${entry.version} visual`}
                                        className="mt-8 w-full rounded-lg object-cover"
                                    />
                                )}
                                {entry.button && (
                                    <Button
                                        variant="link"
                                        className="mt-4 self-end"
                                        asChild
                                    >
                                        <NavLink
                                            to={entry.button.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                        >
                                            {entry.button.text}{" "}
                                            <ArrowUpRight className="h-4 w-4" />
                                        </NavLink>
                                    </Button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    )
}

export { Changelog1 }
