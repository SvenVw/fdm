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

// Data for update posts
export const updatePosts: UpdatePost[] = [
    {
        id: "update-2025-04-11",
        title: "Nieuwe Functies & Uitgebreide Verbeteringen (April 2025)",
        description: `Deze update introduceert een reeks nieuwe functies en significante verbeteringen, ontworpen om uw workflow binnen ${clientConfig.name} efficiënter en duidelijker te maken:

**Nieuwe Pagina's & Functies voor Beter Beheer:**
*   **Uitgebreid Meststoffen Beheer:** We hebben het beheer van meststoffen aanzienlijk uitgebreid. U kunt nu via een speciale pagina een overzicht krijgen van alle beschikbare meststoffen voor uw bedrijf. Daarnaast kunt u de details van elke meststof bekijken en, belangrijker nog, de waarden van *eigen* meststoffen (die u zelf heeft toegevoegd of aangepast) direct bijwerken. Ook is er een nieuwe pagina om eenvoudig nieuwe, bedrijfsspecifieke meststoffen toe te voegen aan uw catalogus, wat zorgt voor een nauwkeurigere registratie van uw bemesting.
*   **Vereenvoudigd Percelen Toevoegen:** Het toevoegen van nieuwe percelen aan uw bedrijf is gestroomlijnd met een toegewijde nieuwe pagina, wat het proces sneller en intuïtiever maakt.
*   **Flexibel Filteren met de Kalender:** In de zijbalk vindt u nu een 'Kalender' optie. Deze e functie stelt u in staat om uw data (zoals percelen, bemestingen, oogsten) te filteren op een specifiek jaar. Dit is ideaal voor jaarlijkse overzichten of analyses. U kunt er ook voor kiezen om alle data ongefilterd te tonen.
*   **Welkomstmail:** Om nieuwe gebruikers welkom te heten, wordt er nu automatisch een welkomstmail verstuurd na succesvolle registratie.

**Verbeteringen in de 'Bedrijf Aanmaken' Wizard:**
*   **Direct bodemanalyse Toevoegen:** U hoeft de wizard niet meer te verlaten om een nieuwe bodemanalyse toe te voegen. Dit kan nu direct tijdens het configureren van een perceel binnen de wizard, wat tijd bespaart.
*   **Duidelijkere Bodem Component:** De manier waarop bodemgegevens worden gepresenteerd en hoe u ermee interacteert op de perceelpagina binnen de wizard, is volledig herzien. Dit zorgt voor een beter overzicht en minder kans op fouten bij het invoeren van bodemdata.
*   **Overzichtelijkere Percelen Pagina:** De layout van de pagina voor het beheren van percelen binnen de wizard is verbeterd voor een betere workflow en duidelijkheid.
*   **Opgeloste Weergaveproblemen Oogst:** Eerdere problemen met het correct weergeven van de oogstlijst en de bijbehorende detailpagina's binnen de wizard zijn verholpen.
*   **Voorkomen van Navigatiefouten:** Om te voorkomen dat u per ongeluk de wizard verlaat, worden de links in de zijbalk nu tijdelijk uitgeschakeld (niet klikbaar) terwijl u bezig bent met het aanmaken van een bedrijf.

**Algemene UI & UX Verbeteringen voor Prettiger Gebruik:**
*   **Verbeterde Paginatitels en Beschrijvingen:** Om de navigatie te vergemakkelijken, hebben veel pagina's nu duidelijkere titels en informatieve beschrijvingen gekregen.
*   **Professionele Uitstraling met Logo:** Het logo wordt nu consistent door de hele applicatie gebruikt, inclusief als website-icoon (favicon) en op plaatsen waar voorheen placeholders stonden. 
*   **Integratie Profielfoto's:** Voor een persoonlijkere ervaring worden nu de profielfoto's van uw gekoppelde Microsoft en Google accounts correct weergegeven in uw gebruikersprofiel.
*   **Transparantie over Ontwikkeling:** Een duidelijke melding op de inlogpagina informeert gebruikers dat de applicatie nog actief in ontwikkeling is en er regelmatig updates plaatsvinden.
*   **Soepelere Sessie Afhandeling:** Mocht uw sessie verlopen of ongeldig worden (bijvoorbeeld door een time-out), dan wordt u nu automatisch en zonder foutmeldingen teruggestuurd naar de inlogpagina.
*   **Consistente Eenheden:** De eenheid voor gewasopbrengst ('b_lu_yield') wordt nu overal correct en consistent weergegeven als kilogram droge stof per hectare (kg DS / ha).`,
        date: new Date("2025-04-11"),
        isNew: true,
    },
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
