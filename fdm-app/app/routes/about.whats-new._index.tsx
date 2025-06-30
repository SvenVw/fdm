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
import { FarmTitle } from "~/components/blocks/farm/farm-title"
import { HeaderAbout } from "~/components/blocks/header/about"
import { Header } from "~/components/blocks/header/base"
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card"
import { Separator } from "~/components/ui/separator"
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
        id: "update-2025-06-26",
        title: "Juni 2025",
        description: `
### Stikstofbalans en Emissies

*   **Ammoniakemissie in Stikstofbalans:** De stikstofbalans is uitgebreid met de berekening van ammoniakemissies. Dit geeft een completer beeld van de stikstofbalans op uw bedrijf en de impact op het milieu. Zowel de totale hoeveelheid uitgestoten ammoniak als de details op perceelsniveau worden nu weergegeven.

### Meststoffenbeheer

*   **Meststof als Sjabloon:** Bij het aanmaken van een nieuwe meststof kunt u nu een bestaande meststof als sjabloon gebruiken. Dit vereenvoudigt het toevoegen van vergelijkbare producten.
*   **Verbeterd Ontwerp Meststofformulier:** Het ontwerp van de pagina voor het beheren van meststoffen is verbeterd, waardoor deze intuïtiever en duidelijker is in het gebruik.
*   **Toedieningsmethode toevoegen:** Het is nu mogelijk om de toedieningsmethode voor elke mestgift te specificeren in het daarvoor bestemde formulier.
*   **Weergave toedieningsmethode:** De gekozen toedieningsmethode voor elke mestgift wordt nu duidelijk weergegeven in de lijst met bemestingen.

### Bemestingsadvies

*   **Advies voor NPK, OS, secondaire nutrienten en spoorelelmenten:** Voor elk perceel kunt u nu het bemestingsadvies zien voor de verschillende nutriënten op basis van de handboeken van CBAV en CBGV.
*   **Bijhouden van Bemestingsniveau:** Als u uw bemesting heeft ingevuld wordt voor elke nutrient bijgehouden hoeveel er al bemest is. Zie eenvoudig welke nutriënt een tekort heeft en welke al voldoende is toegediend.

### PDF Upload voor bodemanalyses

*   **Upload een Bodemanalyse:** Vanaf nu kunt u er voor kiezen om een pdf van een van de ondersteunde laba op te sturen en automatisch uit te lezen. Op deze manier kunt u eenvoudig de gegeven van uw bodemanalyse laten invoeren, zonder er veel moeite voor te doen.

### Kaartfunctionaliteit

*   **Zoekbalk op Interactieve Kaarten:** Er is een zoekbalk toegevoegd aan de interactieve kaarten, waarmee u adressen kunt opzoeken en hier direct naartoe kunt navigeren.

### Overige Verbeteringen

*   **Nieuwe Datumprikkers:** De datumprikkers zijn vervangen door een nieuw, gecombineerde component met uitgebreide functies, zoals een dropdown-selectie voor jaar en maand en de mogelijkheid om direct tekst in te voeren.
*   **Standaard Meststoffencatalogus:** Voor nieuwe bedrijven wordt nu standaard de \`baat\`-catalogus voor meststoffen gebruikt in plaats van \`srm\`. 
`,
        date: new Date("2025-06-26"),
        isNew: true,
    },
    {
        id: "update-2025-05-27",
        title: "Mei 2025",
        description: `Welkom bij de nieuwste update van ${clientConfig.name}! Lees snel verder wat er nieuw is!

## Uitgebreidere Bodemanalyse en Invoer

Het correct invoeren en interpreteren van bodemanalyses is cruciaal. Daarom hebben we de volgende verbeteringen doorgevoerd:

*   **Meer Bodemparameters Beschikbaar:** U kunt nu een nog breder scala aan bodemparameters vastleggen bij uw analyses. Dit omvat belangrijke waarden zoals:
    *   \`a_nmin_cc\` (N-mineraal), \`a_n_rt\` (totale stikstof), \`a_c_of\` (organische koolstof), \`a_cn_fr\` (C/N-verhouding), en \`a_density_sa\` (bodemdichtheid).
    *   Daarnaast is er ondersteuning voor een uitgebreide lijst van specifieke elementen en eigenschappen (zoals \`a_al_ox\`, \`a_ca_co\`, \`a_cec_co\`, etc.), wat een dieper inzicht geeft in de bodemvruchtbaarheid en -samenstelling. Deze gegevens kunnen nu ook direct vanuit NMI-integraties worden overgenomen.
*   **Keuzelijst voor Analysebron:** Bij het invoeren van een bodemanalyse kunt u nu de bron van de analyse selecteren uit een vaste keuzelijst, in plaats van vrije tekstinvoer. Dit zorgt voor meer consistentie in uw data.
*   **Selectie Type Bodemanalyse:** Om het invoerformulier overzichtelijker te maken, kunt u nu een type bodemanalyse selecteren. Afhankelijk van het gekozen type wordt een relevante selectie van parameters getoond.

### Stikstofbalans: Vergelijking en Visualisatie

De stikstofbalans is een belangrijk hulpmiddel. We hebben nieuwe functies toegevoegd om hier meer inzicht in te krijgen:

*   **Vergelijking met Streefwaarde:** Zowel op bedrijfsniveau als op perceelsniveau wordt nu een vergelijking getoond tussen de berekende stikstofbalans en de geldende streefwaarde. Zo ziet u direct hoe u presteert.
*   **Grafische Weergave:** Op de stikstofbalanspagina's (voor bedrijf en percelen) vindt u nu een staafdiagram. Deze grafiek visualiseert de aanvoer, afvoer en emissie van stikstof, wat helpt om de balans beter te begrijpen.

### Organisaties en Toegang tot Bedrijven delen

Samenwerken wordt makkelijker met de nieuwe functies voor organisatiebeheer:

*   **Organisaties Aanmaken en Beheren:** U kunt nu organisaties aanmaken binnen ${clientConfig.name}. Dit is handig als u bijvoorbeeld als adviesbureau met meerdere adviseurs voor verschillende klanten werkt.
*   **Gebruikers Uitnodigen:** Nodig eenvoudig andere gebruikers uit om lid te worden van uw organisatie.
*   **Toegang tot bedrijven delen:** Het is nu mogelijk om toegang to een bedrijf te delen met andere gebruikers of zelfs met hele organisaties. U kunt hierbij aangeven welke rol (en dus welke rechten) de ander krijgt op uw bedrijf. Dit maakt het makkelijker om bijvoorbeeld uw adviseur toegang te geven tot uw bedrijfsgegevens.

### Verbeterd Gebruiksgemak

Ook aan de algemene werking van de app is gesleuteld:

*   **Nieuwe Navigatie via Platform Zijbalk:** Er is een nieuwe zijbalk toegevoegd voor platform-brede zaken. Hier vindt u nu bijvoorbeeld uw accountinstellingen, organisatiebeheer en de "Wat is nieuw"-pagina.
*   **Kaart hernoemd naar Atlas:** De functionaliteit die voorheen "Kaart" heette, is nu hernoemd naar "Atlas" en verplaatst naar het "Apps" gedeelte voor een logischere structuur.
*   **Behouden van Context bij Navigeren:** Wanneer u in de paginakop een ander perceel of bedrijf selecteert, blijft u op de huidige pagina (bijvoorbeeld de instellingenpagina van dat perceel/bedrijf) in plaats van teruggestuurd te worden naar de startpagina.
*   **Betere Afhandeling na Inloggen:** Als u werd doorgestuurd naar de inlogpagina, wordt u na succesvol inloggen nu automatisch teruggebracht naar de pagina die u oorspronkelijk wilde bezoeken.
*   **Vernieuwde Bedrijfsselectiepagina:** De pagina waar u een bedrijf selecteert, heeft een nieuw ontwerp gekregen met overzichtelijke kaarten per bedrijf, waarop direct enkele kerngegevens zichtbaar zijn.
*   **"Wat is Nieuw" verplaatst:** Deze pagina is nu te vinden onder de "Over ${clientConfig.name}" sectie in de nieuwe platform zijbalk.

### Overige Wijzigingen

*   **Beperking Oogst:** Per oogstmoment kan nu slechts één oogstbaar product worden geregistreerd, wat de datastructuur vereenvoudigt.`,
        date: new Date("2025-05-27"),
        isNew: true,
    },
    {
        id: "update-2025-04-14",
        title: "April 2025",
        description: `Deze update introduceert een reeks nieuwe functies en significante verbeteringen, ontworpen om uw workflow binnen ${clientConfig.name} efficiënter en duidelijker te maken:

**Nieuwe Pagina's & Functies voor Beter Beheer:**
*   **Uitgebreid Meststoffen Beheer:** We hebben het beheer van meststoffen aanzienlijk uitgebreid. U kunt nu via een speciale pagina een overzicht krijgen van alle beschikbare meststoffen voor uw bedrijf. Daarnaast kunt u de details van elke meststof bekijken en, belangrijker nog, de waarden van *eigen* meststoffen (die u zelf heeft toegevoegd of aangepast) direct bijwerken. Ook is er een nieuwe pagina om eenvoudig nieuwe, bedrijfsspecifieke meststoffen toe te voegen aan uw catalogus, wat zorgt voor een nauwkeurigere registratie van uw bemesting.
*   **Vereenvoudigd Percelen Toevoegen:** Het toevoegen van nieuwe percelen aan uw bedrijf is gestroomlijnd met een toegewijde nieuwe pagina, wat het proces sneller en intuïtiever maakt.
*   **Flexibel Filteren met de Kalender:** In de zijbalk vindt u nu een 'Kalender' optie. Deze e functie stelt u in staat om uw data (zoals percelen, bemestingen, oogsten) te filteren op een specifiek jaar. Dit is ideaal voor jaarlijkse overzichten of analyses. U kunt er ook voor kiezen om alle data ongefilterd te tonen.
*   **Welkomstmail:** Om nieuwe gebruikers welkom te heten, wordt er nu automatisch een welkomstmail verstuurd na succesvolle registratie.

**Verbeteringen in de 'Bedrijf Aanmaken' Wizard:**
*   **Direct bodemanalyse Toevoegen:** U hoeft de wizard niet meer te verlaten om een nieuwe bodemanalyse toe te voegen. Dit kan nu direct tijdens het configureren van een perceel binnen de wizard, wat tijd bespaart.
*   **Duidelijker Bodem Component:** De manier waarop bodemgegevens worden gepresenteerd en hoe u ermee interacteert op de perceelpagina binnen de wizard, is volledig herzien. Dit zorgt voor een beter overzicht en minder kans op fouten bij het invoeren van bodemdata.
*   **Overzichtelijker Percelen Pagina:** De layout van de pagina voor het beheren van percelen binnen de wizard is verbeterd voor een betere workflow en duidelijkheid.
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
        <>
            <Header action={undefined}>
                <HeaderAbout />
            </Header>
            <main className="container">
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
                                                <em
                                                    className="italic"
                                                    {...props}
                                                />
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
        </>
    )
}
