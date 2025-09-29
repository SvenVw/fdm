import {
    type AggregatedNormsToFarmLevel,
    createFunctionsForNorms,
    type GebruiksnormResult,
} from "@svenvw/fdm-calculator"
import { getFarm, getFarms, getFields } from "@svenvw/fdm-core"
import { AlertTriangle, CircleAlert } from "lucide-react"
import { Suspense, use } from "react"
import {
    data,
    type LoaderFunctionArgs,
    type MetaFunction,
    NavLink,
    useLoaderData,
    useLocation,
} from "react-router"
import { FarmTitle } from "~/components/blocks/farm/farm-title"
import { Header } from "~/components/blocks/header/base"
import { HeaderFarm } from "~/components/blocks/header/farm"
import { FarmNorms } from "~/components/blocks/norms/farm-norms"
import { FieldNorms } from "~/components/blocks/norms/field-norms"
import { NormsFallback } from "~/components/blocks/norms/skeletons"
import { SidebarInset } from "~/components/ui/sidebar"
import { getSession } from "~/lib/auth.server"
import { getCalendar, getTimeframe } from "~/lib/calendar"
import { clientConfig } from "~/lib/config"
import { handleLoaderError } from "~/lib/error"
import { fdm } from "~/lib/fdm.server"
import type { Route } from "../+types/root"
import { HeaderNorms } from "~/components/blocks/header/norms"
import { InlineErrorBoundary } from "~/components/custom/inline-error-boundary"
import { useFieldFilterStore } from "~/store/field-filter"
import { Alert, AlertDescription } from "~/components/ui/alert"
import { Button } from "~/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card"
import { Separator } from "~/components/ui/separator"
import { useFarmFieldOptionsStore } from "~/store/farm-field-options"

interface FieldNorm {
    b_id: string
    b_area: number
    norms?: {
        manure: GebruiksnormResult
        phosphate: GebruiksnormResult
        nitrogen: GebruiksnormResult
    }
    errorMessage?: string
}

// Meta
export const meta: MetaFunction = () => {
    return [
        { title: `Gebruiksnormen ${clientConfig.name}` },
        {
            name: "description",
            content: "Bekijk de Gebruiksnormen voor je bedrijf.",
        },
    ]
}

export async function loader({ request, params }: LoaderFunctionArgs) {
    try {
        // Get the farm id
        const b_id_farm = params.b_id_farm
        if (!b_id_farm) {
            throw data("invalid: b_id_farm", {
                status: 400,
                statusText: "invalid: b_id_farm",
            })
        }

        // Get the field id
        const b_id = params.b_id

        // Get the session
        const session = await getSession(request)

        // Get timeframe from calendar store
        const timeframe = getTimeframe(params)
        const calendar = getCalendar(params)

        // Get details of farm
        const farm = await getFarm(fdm, session.principal_id, b_id_farm)
        if (!farm) {
            throw data("not found: b_id_farm", {
                status: 404,
                statusText: "not found: b_id_farm",
            })
        }

        // Get a list of possible farms of the user
        const farms = await getFarms(fdm, session.principal_id)
        if (!farms || farms.length === 0) {
            throw data("not found: farms", {
                status: 404,
                statusText: "not found: farms",
            })
        }

        const farmOptions = farms.map((farm) => {
            return {
                b_id_farm: farm.b_id_farm,
                b_name_farm: farm.b_name_farm,
            }
        })

        // Get the fields to be selected
        const fields = await getFields(
            fdm,
            session.principal_id,
            b_id_farm,
            timeframe,
        )

        const asyncData = (async () => {
            // Currently only 2025 is supported
            if (calendar !== "2025") {
                return {}
            }

            let fieldNorms = undefined as FieldNorm[] | undefined
            let farmNorms = undefined as AggregatedNormsToFarmLevel | undefined
            let errorMessage = null as string | null
            let hasFieldNormErrors = false
            const fieldErrorMessages: string[] = []
            try {
                // Calculate norms per field
                const functionsForms = createFunctionsForNorms("NL", calendar)

                const fieldNormPromises = fields.map(async (field) => {
                    try {
                        // Collect the input
                        const input = await functionsForms.collectInputForNorms(
                            fdm,
                            session.principal_id,
                            field.b_id,
                        )

                        // Calculate the norms
                        const [normManure, normPhosphate, normNitrogen] =
                            await Promise.all([
                                functionsForms.calculateNormForManure(input),
                                functionsForms.calculateNormForPhosphate(input),
                                functionsForms.calculateNormForNitrogen(input),
                            ])

                        return {
                            b_id: field.b_id,
                            b_area: field.b_area,
                            norms: {
                                manure: normManure,
                                phosphate: normPhosphate,
                                nitrogen: normNitrogen,
                            },
                        }
                    } catch (error) {
                        hasFieldNormErrors = true
                        const fieldName =
                            fields.find((f) => f.b_id === field.b_id)?.b_name ||
                            `Perceel ${field.b_id}`
                        fieldErrorMessages.push(
                            `${fieldName}: ${String(error).replace(
                                "Error: ",
                                "",
                            )}`,
                        )
                        return {
                            b_id: field.b_id,
                            b_area: field.b_area,
                            errorMessage: String(error).replace("Error: ", ""),
                        }
                    }
                })

                const results = await Promise.allSettled(fieldNormPromises)

                fieldNorms = results.map((result) => {
                    if (result.status === "fulfilled") {
                        return result.value
                    }
                    // This case should ideally not be hit if individual promises catch their errors,
                    // but it's a safeguard for unexpected rejections.
                    hasFieldNormErrors = true
                    const fallbackFieldId = "unknown"
                    const fallbackFieldName =
                        fields.find((f) => f.b_id === fallbackFieldId)
                            ?.b_name || `Perceel ${fallbackFieldId}`
                    fieldErrorMessages.push(
                        `${fallbackFieldName}: ${String(result.reason).replace(
                            "Error: ",
                            "",
                        )}`,
                    )
                    return {
                        b_id: fallbackFieldId, // Fallback ID
                        b_area: 0, // Fallback area
                        errorMessage: String(result.reason).replace(
                            "Error: ",
                            "",
                        ),
                    }
                })

                // Aggregate the norms to farm level
                const validFieldNorms = (fieldNorms || []).filter(
                    (field) => field.norms !== undefined,
                ) as {
                    b_id: string
                    b_area: number
                    norms: {
                        manure: GebruiksnormResult
                        phosphate: GebruiksnormResult
                        nitrogen: GebruiksnormResult
                    }
                }[]
                farmNorms =
                    await functionsForms.aggregateNormsToFarmLevel(
                        validFieldNorms,
                    )
            } catch (error) {
                errorMessage = String(error).replace("Error: ", "")
            }

            // Return user information from loader
            return {
                errorMessage: errorMessage,
                fieldNorms: fieldNorms,
                farmNorms: farmNorms,
                hasFieldNormErrors: hasFieldNormErrors,
                fieldErrorMessages: fieldErrorMessages,
            }
        })()

        return {
            farm: farm,
            b_id_farm: b_id_farm,
            b_id: b_id,
            calendar: calendar,
            farmOptions: farmOptions,
            fields: fields,
            asyncData,
        }
    } catch (error) {
        throw handleLoaderError(error)
    }
}

export default function FarmNormsBlock() {
    const loaderData = useLoaderData<typeof loader>()

    return (
        <SidebarInset>
            <Header action={undefined}>
                <HeaderFarm
                    b_id_farm={loaderData.b_id_farm}
                    farmOptions={loaderData.farmOptions}
                />
                <HeaderNorms b_id_farm={loaderData.b_id_farm} />
            </Header>
            <main>
                <FarmTitle
                    title={"Gebruiksnormen"}
                    description={
                        "Bekijk de gebruiksnormen voor je bedrijf en percelen."
                    }
                />
                <Suspense
                    key={`${loaderData.b_id_farm}#${loaderData.calendar}`}
                    fallback={<NormsFallback />}
                >
                    <Norms {...loaderData} />
                </Suspense>
            </main>
        </SidebarInset>
    )
}

/**
 * Renders the page elements with asynchronously loaded data
 *
 * This has to be extracted into a separate component because of the `use(...)` hook.
 * React will not render the component until `asyncData` resolves, but React Router
 * handles it nicely via the `Suspense` component and server-to-client data streaming.
 * If `use(...)` was added to `FarmNormsBlock` instead, the Suspense
 * would not render until `asyncData` resolves and the fallback would never be shown.
 */
function Norms(loaderData: Awaited<ReturnType<typeof loader>>) {
    const {
        farmNorms,
        fieldNorms,
        errorMessage,
        hasFieldNormErrors,
        fieldErrorMessages,
    } = use(loaderData.asyncData)
    const { showProductiveOnly } = useFieldFilterStore()

    const location = useLocation()
    const page = location.pathname

    if (errorMessage) {
        return (
            <div className="flex items-center justify-center">
                <Card className="w-[350px]">
                    <CardHeader>
                        <CardTitle>
                            Helaas is het niet mogelijk om je gebruiksnormen uit
                            te rekenen
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-muted-foreground">
                            <p>
                                Er is onverwacht wat misgegaan. Probeer opnieuw
                                of neem contact op met Ondersteuning en deel de
                                volgende foutmelding:
                            </p>
                            <div className="mt-8 w-full max-w-2xl">
                                <pre className="bg-gray-200 dark:bg-gray-800 p-4 rounded-md overflow-x-auto text-sm text-gray-800 dark:text-gray-200">
                                    {JSON.stringify(
                                        {
                                            message: errorMessage,
                                            page: page,
                                            timestamp: new Date(),
                                        },
                                        null,
                                        2,
                                    )}
                                </pre>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        )
    }

    if (farmNorms && fieldNorms) {
        const fieldOptions = loaderData.fields
            .filter((f) => f?.b_id && f?.b_name)
            .map((f) => ({ b_id: f.b_id, b_name: f.b_name }))

        const fieldsMap = new Map(loaderData.fields.map((f) => [f.b_id, f]))
        const filteredFieldNorms = fieldNorms.filter((fieldNorm) => {
            if (!showProductiveOnly) return true
            const fieldData = fieldsMap.get(fieldNorm.b_id)
            return fieldData ? fieldData.b_isproductive === true : false
        })

        return (
            <div className="space-y-6 px-10 pb-16">
                <Alert className="mb-8  border-amber-200 bg-amber-50">
                    <AlertDescription className="text-amber-800">
                        <strong>Disclaimer:</strong> Deze getallen zijn
                        uitsluitend bedoeld voor informatieve doeleinden. De
                        getoonde gebruiksnormen zijn indicatief en dienen te
                        worden geverifieerd voor juridische naleving. Raadpleeg
                        altijd de officiële RVO-publicaties en uw adviseur voor
                        definitieve normen.
                    </AlertDescription>
                </Alert>
                <FarmNorms
                    farmNorms={farmNorms}
                    hasFieldNormErrors={hasFieldNormErrors}
                    fieldErrorMessages={fieldErrorMessages}
                />
                <Separator className="my-8" />
                <FieldNorms
                    fieldNorms={filteredFieldNorms}
                    fieldOptions={fieldOptions}
                />
            </div>
        )
    }
    // This block is now an independent return, not an else clause
    return (
        <div className="mx-auto flex h-full w-full items-center flex-col justify-center space-y-6">
            <div className="flex flex-col space-y-2 text-center">
                <h1 className="text-2xl font-semibold tracking-tight">
                    Helaas, nog geen gebruiksnormen beschikbaar voor{" "}
                    {loaderData.calendar}
                </h1>
                <p className="text-sm text-muted-foreground">
                    Op dit moment kunnen we alleen nog de gebruiksnormen voor
                    2025 berekenen en weergeven.
                </p>
                <NavLink to={`/farm/${loaderData.b_id_farm}/2025/norms`}>
                    <Button>Ga naar 2025</Button>
                </NavLink>
            </div>
        </div>
    )
}

export function ErrorBoundary(props: Route.ErrorBoundaryProps) {
    const { params } = props

    const farmFieldOptionsStore = useFarmFieldOptionsStore()

    return (
        <SidebarInset>
            <Header action={undefined}>
                <HeaderFarm
                    b_id_farm={params.b_id_farm}
                    farmOptions={farmFieldOptionsStore.farmOptions}
                />
                <HeaderNorms b_id_farm={params.b_id_farm} />
            </Header>
            <main>
                <InlineErrorBoundary {...props} />
            </main>
        </SidebarInset>
    )
}
