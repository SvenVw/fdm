import {
    type ActionFunctionArgs,
    Form,
    type LoaderFunctionArgs,
    type MetaFunction,
    NavLink,
    redirect,
    useActionData,
    useLoaderData,
    useNavigation,
    useParams,
} from "react-router"
import { getSession } from "~/lib/auth.server"
import { fdm } from "~/lib/fdm.server"
import {
    generateAuthUrl,
    fetchRvoFields,
    compareFields,
    createRvoClient,
} from "~/lib/rvo.server"
import { serverConfig } from "~/lib/config.server"
import {
    type RvoImportReviewItem,
    type ImportReviewAction,
    type UserChoiceMap,
    processRvoImport,
    getItemId,
} from "@svenvw/fdm-rvo"
import { RvoImportReviewTable } from "~/components/blocks/rvo/import-review-table"
import { getFarm } from "@svenvw/fdm-core"
import { Alert, AlertDescription, AlertTitle } from "~/components/ui/alert"
import { Button } from "~/components/ui/button"
import { Loader2, AlertTriangle, FlaskConical } from "lucide-react"
import { useEffect, useState } from "react"
import { Header } from "~/components/blocks/header/base"
import { HeaderFarmCreate } from "~/components/blocks/header/create-farm"
import { SidebarInset } from "~/components/ui/sidebar"
import {
    BreadcrumbItem,
    BreadcrumbSeparator,
    BreadcrumbLink,
} from "~/components/ui/breadcrumb"
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "~/components/ui/card"
import { CheckCircle2 } from "lucide-react"

export const meta: MetaFunction = ({ params }) => {
    const b_id_farm = params.b_id_farm
    return [{ title: `RVO Import - Nieuw Bedrijf ${b_id_farm}` }]
}

export async function loader({ request, params }: LoaderFunctionArgs) {
    const { b_id_farm, calendar } = params
    if (!b_id_farm || !calendar) {
        throw new Response("Farm ID en Kalender zijn verplicht", {
            status: 400,
        })
    }

    const session = await getSession(request)
    const url = new URL(request.url)
    const code = url.searchParams.get("code")
    const state = url.searchParams.get("state")

    let RvoImportReviewData: RvoImportReviewItem<any>[] = []
    let error: string | null = null
    let b_businessid_farm: string | null = null
    let b_name_farm: string | null | undefined = null

    // Check if RVO is configured
    const rvoConfigured =
        serverConfig.auth.rvo.clientId !== "undefined" &&
        serverConfig.auth.rvo.clientId !== "" &&
        serverConfig.auth.rvo.clientSecret !== "undefined" &&
        serverConfig.auth.rvo.clientSecret !== ""

    const farm = await getFarm(fdm, session.principal_id, b_id_farm)
    if (farm) {
        b_businessid_farm = farm.b_businessid_farm
        b_name_farm = farm.b_name_farm
    }

    if (code && state) {
        try {
            if (!rvoConfigured) {
                throw new Response("RVO is niet geconfigureerd.", {
                    status: 500,
                })
            }

            const decodedState = JSON.parse(
                Buffer.from(state, "base64").toString("utf-8"),
            )
            if (decodedState.farmId !== b_id_farm) {
                throw new Response("Ongeldige state parameter", { status: 403 })
            }

            if (!farm || !farm.b_businessid_farm) {
                throw new Response(
                    "Geen KvK-nummer gevonden voor dit bedrijf.",
                    { status: 400 },
                )
            }

            const { clientId, clientSecret, redirectUri, clientName } =
                serverConfig.auth.rvo
            const rvoClient = createRvoClient(
                clientId,
                clientName,
                redirectUri,
                clientSecret,
                process.env.NODE_ENV === "production"
                    ? "production"
                    : "acceptance",
            ) // Instantiate RvoClient

            const rvoFields = await fetchRvoFields(
                rvoClient,
                new Date().getFullYear(),
                farm.b_businessid_farm,
            )

            const localFields: any[] = [] // No existing fields to compare against yet
            RvoImportReviewData = compareFields(localFields, rvoFields)
        } catch (e: any) {
            console.error("RVO Import Fout:", e)
            error = e.message
        }
    } else if (!url.searchParams.has("start_import")) {
        return {
            b_id_farm,
            b_businessid_farm,
            calendar,
            RvoImportReviewData: [],
            error: null,
            showImportButton: true,
            rvoConfigured,
            b_name_farm,
        }
    }

    return {
        b_id_farm,
        calendar,
        RvoImportReviewData,
        error,
        showImportButton: false,
        rvoConfigured,
        b_name_farm,
    }
}

export default function RvoImportCreatePage() {
    const { b_id_farm, b_businessid_farm } = useParams()
    const {
        RvoImportReviewData,
        error,
        showImportButton,
        rvoConfigured,
        b_name_farm,
    } = useLoaderData<typeof loader>()
    const actionData = useActionData<typeof action>()
    const navigation = useNavigation()
    const isImporting =
        navigation.state === "submitting" &&
        navigation.formData?.get("intent") === "start_import"
    const isSaving =
        navigation.state === "submitting" &&
        navigation.formData?.get("intent") === "save_fields"

    const [userChoices, setUserChoices] = useState<UserChoiceMap>({})

    useEffect(() => {
        // Initialize user choices with defaults
        const initialChoices: UserChoiceMap = {}
        RvoImportReviewData.forEach((item) => {
            const id = getItemId(item)
            let defaultAction: ImportReviewAction = "NO_ACTION"

            switch (item.status) {
                case "NEW_REMOTE":
                    defaultAction = "ADD_REMOTE"
                    break
                // In creation wizard, other statuses are unlikely but good to handle defaults
                default:
                    defaultAction = "NO_ACTION"
                    break
            }
            initialChoices[id] = defaultAction
        })
        setUserChoices(initialChoices)
    }, [RvoImportReviewData])

    const handleChoiceChange = (id: string, action: ImportReviewAction) => {
        setUserChoices((prev) => ({ ...prev, [id]: action }))
    }

    return (
        <SidebarInset>
            <Header action={undefined}>
                <HeaderFarmCreate b_name_farm={b_name_farm} />
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                    <BreadcrumbLink>Percelen ophalen bij RVO</BreadcrumbLink>
                </BreadcrumbItem>
            </Header>
            <main className="flex-1 overflow-auto">
                <div className="flex h-full items-center justify-center p-6">
                    {" "}
                    {/* Centered layout like upload page */}
                    <div className="w-full max-w-lg space-y-6">
                        {" "}
                        {/* Max width constraint */}
                        {error && (
                            <Alert variant="destructive">
                                <AlertTitle>
                                    Er is iets misgegaan bij het importeren
                                </AlertTitle>
                                <AlertDescription>{error}</AlertDescription>
                            </Alert>
                        )}
                        {actionData?.message && (
                            <Alert
                                variant={
                                    actionData.success
                                        ? "default"
                                        : "destructive"
                                }
                            >
                                <AlertTitle>
                                    {actionData.success ? "Succes" : "Fout"}
                                </AlertTitle>
                                <AlertDescription>
                                    {actionData.message}
                                </AlertDescription>
                            </Alert>
                        )}
                        {/* Config Warning */}
                        {!rvoConfigured && (
                            <Alert
                                variant="destructive"
                                className="border-red-200 bg-red-50 text-red-800"
                            >
                                <AlertTitle className="flex items-center gap-2">
                                    <AlertTriangle className="h-4 w-4" />
                                    Importen vanuit RVO is niet beschikbaar
                                </AlertTitle>
                                <AlertDescription>
                                    De RVO koppeling is nog niet ingesteld op
                                    deze server. Neem contact op met de
                                    beheerder om de RVO toeggangegevens toe te
                                    voegen.
                                </AlertDescription>
                            </Alert>
                        )}
                        {showImportButton && (
                            <Card>
                                <CardHeader className="space-y-6">
                                    <CardTitle>
                                        Percelen ophalen bij RVO
                                    </CardTitle>
                                    <Alert>
                                        <FlaskConical className="h-4 w-4" />
                                        <AlertTitle>
                                            Experimentele functie
                                        </AlertTitle>
                                        <AlertDescription className="text-muted-foreground">
                                            Deze functie is nog in ontwikkeling.
                                            Laat ons het weten als je feedback
                                            hebt!
                                        </AlertDescription>
                                    </Alert>
                                    <CardDescription>
                                        Lees hieronder wat u nodig heeft om te
                                        verbinden.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="bg-slate-50 p-4 rounded-md border border-slate-100">
                                        <h4 className="font-semibold text-slate-900 mb-2">
                                            Voorwaarden voor gebruik:
                                        </h4>
                                        <ul className="list-disc list-inside space-y-1 text-slate-700">
                                            <li>
                                                U heeft een geldig KvK-nummer
                                                gekoppeld aan uw account.
                                            </li>
                                            <li>
                                                U heeft een eHerkenning account
                                                met machtiging voor dit
                                                KvK-nummer.
                                            </li>
                                            <li>
                                                U geeft ons toestemming om
                                                perceelsgegevens op te halen.
                                            </li>
                                        </ul>
                                    </div>

                                    <div className="flex flex-col sm:flex-row gap-6 mt-6">
                                        <div className="flex-1">
                                            <h4 className="font-medium text-gray-900 mb-2">
                                                KvK Nummer
                                            </h4>
                                            {b_businessid_farm ? (
                                                <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded text-green-800">
                                                    <CheckCircle2 className="h-5 w-5" />
                                                    <span className="font-mono font-medium">
                                                        {b_businessid_farm}
                                                    </span>
                                                </div>
                                            ) : (
                                                <div className="p-3 bg-red-50 border border-red-200 rounded text-red-800 text-sm">
                                                    Geen KvK-nummer gevonden.
                                                    Voeg deze toe in de
                                                    bedrijfsgegevens.
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex-1">
                                            <h4 className="font-medium text-gray-900 mb-2">
                                                Wat gebeurt er?
                                            </h4>
                                            <p className="text-sm text-gray-600 leading-relaxed">
                                                Na het klikken op "Importeer van
                                                RVO" wordt u doorgestuurd naar
                                                de inlogpagina van RVO. Na
                                                authenticatie met eHerkenning
                                                keert u terug naar deze pagina
                                                om de verschillen te beoordelen.
                                            </p>
                                        </div>
                                    </div>
                                </CardContent>
                                <CardFooter className="flex justify-end pt-2">
                                    {!b_businessid_farm ? (
                                        <Button
                                            variant="outline"
                                            asChild
                                            className="w-full"
                                        >
                                            <NavLink
                                                to={`/farm/${b_id_farm}/settings`}
                                            >
                                                KvK-nummer toevoegen
                                            </NavLink>
                                        </Button>
                                    ) : (
                                        <Form method="post" className="w-full">
                                            <input
                                                type="hidden"
                                                name="intent"
                                                value="start_import"
                                            />
                                            <Button
                                                type="submit"
                                                disabled={
                                                    isImporting ||
                                                    !rvoConfigured
                                                }
                                                className="w-full"
                                            >
                                                {isImporting ? (
                                                    <>
                                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                        Verbinden met RVO...
                                                    </>
                                                ) : (
                                                    "Verbinden met RVO"
                                                )}
                                            </Button>
                                        </Form>
                                    )}
                                </CardFooter>
                            </Card>
                        )}
                        {RvoImportReviewData.length > 0 && (
                            <Card className="w-full max-w-4xl mx-auto">
                                {" "}
                                {/* Wider card for table */}
                                <CardHeader>
                                    <CardTitle>
                                        Verwerken van geïmporteerde percelen
                                    </CardTitle>
                                    <CardDescription>
                                        Controleer de percelen opgehaald vanuit
                                        RVO. Deze worden toegevoegd aan uw
                                        nieuwe bedrijf.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <RvoImportReviewTable
                                        data={RvoImportReviewData}
                                        userChoices={userChoices}
                                        onChoiceChange={handleChoiceChange}
                                    />
                                </CardContent>
                                <CardFooter className="flex justify-end pt-4">
                                    <Form method="post">
                                        <input
                                            type="hidden"
                                            name="intent"
                                            value="save_fields"
                                        />
                                        <input
                                            type="hidden"
                                            name="userChoices"
                                            value={JSON.stringify(userChoices)}
                                        />
                                        <input
                                            type="hidden"
                                            name="RvoImportReviewDataJson"
                                            value={JSON.stringify(
                                                RvoImportReviewData,
                                            )}
                                        />
                                        <Button
                                            type="submit"
                                            disabled={isSaving}
                                        >
                                            {isSaving ? (
                                                <>
                                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                    Opslaan...
                                                </>
                                            ) : (
                                                "Opslaan en verder"
                                            )}
                                        </Button>
                                    </Form>
                                </CardFooter>
                            </Card>
                        )}
                    </div>
                </div>
            </main>
        </SidebarInset>
    )
}

export async function action({ request, params }: ActionFunctionArgs) {
    const { b_id_farm, calendar } = params
    if (!b_id_farm || !calendar) {
        throw new Response("b_id_farm and calendar are required", {
            status: 400,
        })
    }

    const session = await getSession(request)
    const formData = await request.formData()
    const intent = formData.get("intent")

    if (intent === "start_import") {
        const rvoConfigured =
            serverConfig.auth.rvo.clientId !== "undefined" &&
            serverConfig.auth.rvo.clientId !== "" &&
            serverConfig.auth.rvo.clientSecret !== "undefined" &&
            serverConfig.auth.rvo.clientSecret !== ""

        if (!rvoConfigured) {
            throw new Response("RVO client is not available", { status: 500 })
        }

        const { clientId, clientSecret, redirectUri, clientName } =
            serverConfig.auth.rvo
        const rvoClient = createRvoClient(
            clientId,
            clientName,
            redirectUri,
            clientSecret,
            process.env.NODE_ENV === "production" ? "production" : "acceptance",
        ) // Instantiate RvoClient
        const state = Buffer.from(
            JSON.stringify({ farmId: b_id_farm, returnUrl: request.url }),
        ).toString("base64")
        const authUrl = generateAuthUrl(rvoClient, state) // Pass rvoClient instance
        return redirect(authUrl)
    }

    if (intent === "save_fields") {
        const RvoImportReviewDataJson = formData.get("RvoImportReviewDataJson")
        const userChoicesJson = formData.get("userChoices")

        if (!RvoImportReviewDataJson || !userChoicesJson) {
            return {
                success: false,
                message:
                    "Geen data gevonden om te verwerken. Start de RVO import opnieuw.",
            }
        }

        try {
            const RvoImportReviewData: RvoImportReviewItem<any>[] = JSON.parse(
                String(formData.get("RvoImportReviewDataJson")),
            )
            const userChoices: UserChoiceMap = JSON.parse(
                String(userChoicesJson),
            )

            await processRvoImport(
                fdm,
                session.principal_id,
                b_id_farm,
                RvoImportReviewData,
                userChoices,
            )
            return redirect(`/farm/create/${b_id_farm}/${calendar}/fields`)
        } catch (e: any) {
            console.error("Error at saving RVO fields: ", e)
            return {
                success: false,
                message: `Error at saving RVO fields: ${e.message}`,
            }
        }
    }

    return {}
}
