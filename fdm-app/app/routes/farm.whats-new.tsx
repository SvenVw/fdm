import { formatDistanceToNow } from "date-fns"
import { nl } from "date-fns/locale"
import { Sparkles } from "lucide-react"
import ReactMarkdown from "react-markdown"
import {
    type LoaderFunctionArgs,
    type MetaFunction,
    useLoaderData,
} from "react-router"
import remarkGfm from "remark-gfm"
import { FarmTitle } from "~/components/custom/farm/farm-title"
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
} from "~/components/ui/breadcrumb"
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card"
import { Separator } from "~/components/ui/separator"
import { SidebarTrigger } from "~/components/ui/sidebar"
import { getSession } from "~/lib/auth.server"
import { clientConfig } from "~/lib/config"
import { handleLoaderError } from "~/lib/error"

export const meta: MetaFunction = () => {
    return [
        { title: `Wat is er nieuw? | ${clientConfig.name}` },
        {
            name: "description",
            content: `Blijf op de hoogte van de laatste ontwikkelingen en verbeteringen van ${clientConfig.name}.`,
        },
    ]
}

// Define the structure for a single update post
export interface UpdatePost {
    id: string
    title: string
    description: string // Description is now a markdown string
    date: Date
    isNew?: boolean
}

// Dta for update posts
export const updatePosts: UpdatePost[] = [
    {
        id: "update-1",
        title: `Lancering ${clientConfig.name} 🎉`,
        description: `${clientConfig.name} is gelanceerd! Vanaf nu kun je bedrijven aanmaken, percelen toevoegen en bemestingen invullen. 

**Nieuwe features:**
- Account aanmaken
- Bedrijven aanmaken
- Percelen toevoegen
- Bemestingen invullen`,
        date: new Date("2025-03-14"),
        isNew: true,
    },
]

/**
 * Retrieves the user session and update posts data.
 *
 * @param request - The HTTP request object used to retrieve session information.
 * @returns An object containing:
 *   - updatePosts: An array of objects, each with a update post.
 *   - username: The user's name from the session data.
 *
 * @throws {Error} If retrieving the session or fetching the update posts data fails.
 */
export async function loader({ request }: LoaderFunctionArgs) {
    try {
        // Get the session
        const session = await getSession(request)

        // Return user information from loader
        return {
            updatePosts: updatePosts,
            username: session.userName,
        }
    } catch (error) {
        throw handleLoaderError(error)
    }
}

/**
 * Renders the user interface for What's New.
 *
 * This component uses data from the loader to display a personalized greeting and a list of
 * update posts.
 */
export default function WhatsNew() {
    const loaderData = useLoaderData<typeof loader>()

    return (
        <main className="container">
            <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
                <SidebarTrigger className="-ml-1" />
                <Separator orientation="vertical" className="mr-2 h-4" />
                <Breadcrumb>
                    <BreadcrumbList>
                        <BreadcrumbItem className="hidden md:block">
                            <BreadcrumbLink href="/farm/whats-new">
                                Wat is er nieuw?
                            </BreadcrumbLink>
                        </BreadcrumbItem>
                    </BreadcrumbList>
                </Breadcrumb>
            </header>
            <div className="max-w-3xl mx-auto px-4">
                <div className="mb-8">
                    <FarmTitle
                        title={`Hoi, ${loaderData.username}! 👋`}
                        description={
                            "Benieuwd naar de laatste updates en nieuwe features van MINAS2? Hier vind je een overzicht van alle recente updates en verbeteringen."
                        }
                    />
                </div>
                <div className="flex flex-col gap-6">
                    {loaderData.updatePosts.map((post) => (
                        <Card
                            key={post.id}
                            className="border-2 border-muted-foreground/20 hover:border-primary transition-colors"
                        >
                            <CardHeader className="space-y-1">
                                <div className="flex items-center justify-between">
                                    <CardTitle className="text-lg font-semibold flex items-center gap-2">
                                        {post.isNew && (
                                            <Sparkles className="h-4 w-4 text-primary" />
                                        )}
                                        {post.title}
                                    </CardTitle>
                                    <p className="text-sm text-muted-foreground">
                                        {formatDistanceToNow(post.date, {
                                            addSuffix: true,
                                            locale: nl,
                                        })}
                                    </p>
                                </div>
                            </CardHeader>
                            <Separator />
                            <CardContent className="py-4">
                                {/* Use ReactMarkdown to render the description */}
                                <ReactMarkdown
                                    remarkPlugins={[remarkGfm]}
                                    components={{
                                        p: ({ node, ...props }) => (
                                            <p
                                                className="text-sm text-muted-foreground"
                                                {...props}
                                            />
                                        ),
                                        ul: ({ node, ...props }) => (
                                            <ul
                                                className="list-disc list-inside text-sm text-muted-foreground"
                                                {...props}
                                            />
                                        ),
                                        ol: ({ node, ...props }) => (
                                            <ol
                                                className="list-decimal list-inside text-sm text-muted-foreground"
                                                {...props}
                                            />
                                        ),
                                        li: ({ node, ...props }) => (
                                            <li
                                                className="text-sm text-muted-foreground"
                                                {...props}
                                            />
                                        ),
                                        strong: ({ node, ...props }) => (
                                            <strong
                                                className="font-semibold"
                                                {...props}
                                            />
                                        ),
                                        em: ({ node, ...props }) => (
                                            <em className="italic" {...props} />
                                        ),
                                    }}
                                >
                                    {post.description}
                                </ReactMarkdown>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        </main>
    )
}
