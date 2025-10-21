import type { GebruiksnormResult, NormFilling } from "@svenvw/fdm-calculator"
import {
    createFunctionsForFertilizerApplicationFilling,
    createFunctionsForNorms,
} from "@svenvw/fdm-calculator"
import {
    getFarm,
    getFarms,
    getFertilizerApplications,
    getField,
} from "@svenvw/fdm-core"
import { format } from "date-fns"
import { nl } from "date-fns/locale"
import { AlertTriangle } from "lucide-react"
import { Suspense, use } from "react"
import {
    data,
    type LoaderFunctionArgs,
    type MetaFunction,
    useLoaderData,
} from "react-router"
import { FarmTitle } from "~/components/blocks/farm/farm-title"
import { Header } from "~/components/blocks/header/base"
import { HeaderFarm } from "~/components/blocks/header/farm"
import { HeaderNorms } from "~/components/blocks/header/norms"
import { NormsFallback } from "~/components/blocks/norms/skeletons"
import { Alert, AlertDescription, AlertTitle } from "~/components/ui/alert"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "~/components/ui/card"
import { Separator } from "~/components/ui/separator"
import { SidebarInset } from "~/components/ui/sidebar"
import { getSession } from "~/lib/auth.server"
import { getCalendar, getTimeframe } from "~/lib/calendar"
import { clientConfig } from "~/lib/config"
import { handleLoaderError } from "~/lib/error"
import { fdm } from "~/lib/fdm.server"

interface FieldNormData {
    b_id: string
    b_name: string
    b_area: number
    norms?: {
        manure: GebruiksnormResult
        phosphate: GebruiksnormResult
        nitrogen: GebruiksnormResult
    }
    normsFilling?: {
        manure: NormFilling
        phosphate: NormFilling
        nitrogen: NormFilling
    }
    fertilizerApplications?: Awaited<
        ReturnType<typeof getFertilizerApplications>
    >
    errorMessage?: string
}

type FertilizerApplication = Awaited<
    ReturnType<typeof getFertilizerApplications>
>[number]

// Meta
export const meta: MetaFunction = ({ params }) => {
    const fieldId = params.b_id || "Onbekend perceel"
    return [
        { title: `Gebruiksnormen Perceel ${fieldId} ${clientConfig.name}` },
        {
            name: "description",
            content: `Bekijk de Gebruiksnormen voor perceel ${fieldId}.`,
        },
    ]
}

export async function loader({ request, params }: LoaderFunctionArgs) {
    try {
        const b_id_farm = params.b_id_farm
        const b_id = params.b_id
        if (!b_id_farm) {
            throw data("invalid: b_id_farm", {
                status: 400,
                statusText: "invalid: b_id_farm",
            })
        }
        if (!b_id) {
            throw data("invalid: b_id", {
                status: 400,
                statusText: "invalid: b_id",
            })
        }

        const session = await getSession(request)
        const timeframe = getTimeframe(params)
        const calendar = getCalendar(params)

        const farm = await getFarm(fdm, session.principal_id, b_id_farm)
        if (!farm) {
            throw data("not found: b_id_farm", {
                status: 404,
                statusText: "not found: b_id_farm",
            })
        }

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

        const field = await getField(fdm, session.principal_id, b_id, timeframe)
        if (!field) {
            throw data("not found: b_id", {
                status: 404,
                statusText: "not found: b_id",
            })
        }

        const asyncData = (async () => {
            if (calendar !== "2025") {
                return {
                    fieldNormData: undefined,
                    errorMessage:
                        "Gebruiksnormen zijn alleen beschikbaar voor 2025.",
                }
            }

            let fieldNormData: FieldNormData = {
                b_id: field.b_id,
                b_name: field.b_name,
                b_area: field.b_area,
            }
            let errorMessage: string | null = null

            try {
                const functionsForNorms = createFunctionsForNorms(
                    "NL",
                    calendar,
                )
                const functionsForFilling =
                    createFunctionsForFertilizerApplicationFilling(
                        "NL",
                        calendar,
                    )

                const input = await functionsForNorms.collectInputForNorms(
                    fdm,
                    session.principal_id,
                    field.b_id,
                )

                const [normManure, normPhosphate, normNitrogen] =
                    await Promise.all([
                        functionsForNorms.calculateNormForManure(input),
                        functionsForNorms.calculateNormForPhosphate(input),
                        functionsForNorms.calculateNormForNitrogen(input),
                    ])

                const fillingInput =
                    await functionsForFilling.collectInputForFertilizerApplicationFilling(
                        fdm,
                        session.principal_id,
                        field.b_id,
                        normPhosphate.normValue,
                    )

                const [fillingManure, fillingPhosphate, fillingNitrogen] =
                    await Promise.all([
                        functionsForFilling.calculateFertilizerApplicationFillingForManure(
                            fillingInput,
                        ),
                        functionsForFilling.calculateFertilizerApplicationFillingForPhosphate(
                            fillingInput,
                        ),
                        functionsForFilling.calculateFertilizerApplicationFillingForNitrogen(
                            fillingInput,
                        ),
                    ])

                const fertilizerApplications = await getFertilizerApplications(
                    fdm,
                    session.principal_id,
                    field.b_id,
                    timeframe,
                )

                fieldNormData = {
                    ...fieldNormData,
                    norms: {
                        manure: normManure,
                        phosphate: normPhosphate,
                        nitrogen: normNitrogen,
                    },
                    normsFilling: {
                        manure: fillingManure,
                        phosphate: fillingPhosphate,
                        nitrogen: fillingNitrogen,
                    },
                    fertilizerApplications: fertilizerApplications,
                }
            } catch (error) {
                errorMessage = String(error).replace("Error: ", "")
                fieldNormData = { ...fieldNormData, errorMessage }
            }

            return { fieldNormData, errorMessage }
        })()

        return {
            farm,
            field,
            b_id_farm,
            b_id,
            calendar,
            farmOptions,
            asyncData,
        }
    } catch (error) {
        throw handleLoaderError(error)
    }
}

export default function FieldNormsBlock() {
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
                    title={"Gebruiksruimte"}
                    description={`Bekijk de gebruiksruimte en opvulling voor ${loaderData.field.b_name}.`}
                />
                <Suspense
                    key={`${loaderData.b_id}#${loaderData.calendar}`}
                    fallback={<NormsFallback />}
                >
                    <FieldNormsContent {...loaderData} />
                </Suspense>
            </main>
        </SidebarInset>
    )
}

const getProgressColorClass = (percentage: number) => {
    if (percentage > 100) return "bg-orange-500"
    return "bg-green-500"
}

interface ProgressBarProps {
    value: number
}

const ProgressBar = ({ value }: ProgressBarProps) => (
    <div className="h-2 w-full rounded-full bg-muted">
        <div
            className={`h-full rounded-full ${getProgressColorClass(value)}`}
            style={{ width: `${Math.min(value, 100)}%` }}
        />
    </div>
)

interface NormCardProps {
    title: string
    norm: GebruiksnormResult | undefined
    filling: NormFilling | undefined
}

const NormCard = ({ title, norm, filling }: NormCardProps) => {
    if (!norm) return null

    const normValue = norm.normValue || 0
    const normSource = norm.normSource || ""
    const fillingValue = filling?.normFilling || 0
    const percentage = normValue > 0 ? (fillingValue / normValue) * 100 : 0

    return (
        <Card>
            <CardHeader>
                <CardTitle>{title}</CardTitle>
                <CardDescription>{normSource}</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-2">
                    <div className="flex justify-between text-lg font-semibold">
                        <span>{fillingValue.toFixed(0)}</span>
                        <span>{normValue.toFixed(0)} kg</span>
                    </div>
                    <ProgressBar value={percentage} />
                    <div className="text-right text-sm text-muted-foreground">
                        {percentage.toFixed(0)}% gebruikt
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}

interface FertilizerApplicationCardProps {
    application: FertilizerApplication
    normsFilling: {
        manure: NormFilling
        phosphate: NormFilling
        nitrogen: NormFilling
    }
}

const FertilizerApplicationCard = ({
    application,
    normsFilling,
}: FertilizerApplicationCardProps) => {
    console.log(normsFilling)
    const applicationFilling = {
        nitrogen: normsFilling.nitrogen.applicationFilling.find(
            (d: { p_app_id: string }) => d.p_app_id === application.p_app_id,
        ),
        phosphate: normsFilling.phosphate.applicationFilling.find(
            (d: { p_app_id: string }) => d.p_app_id === application.p_app_id,
        ),
        manure: normsFilling.manure.applicationFilling.find(
            (d: { p_app_id: string }) => d.p_app_id === application.p_app_id,
        ),
    }
    console.log(applicationFilling)

    return (
        <Card>
            <CardHeader>
                <CardTitle>{application.p_name_nl}</CardTitle>
                <CardDescription>
                    {format(new Date(application.p_app_date), "d MMMM yyyy", {
                        locale: nl,
                    })}{" "}
                    - {application.p_app_amount} kg/ha
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div>
                    <h4 className="font-medium">Stikstof, werkzaam</h4>
                    <p className="text-lg font-semibold">
                        {applicationFilling.nitrogen?.normFilling?.toFixed(0) ||
                            0}{" "}
                        kg
                    </p>
                    {applicationFilling.nitrogen?.normFillingDetails && (
                        <p className="text-xs text-muted-foreground">
                            {applicationFilling.nitrogen.normFillingDetails}
                        </p>
                    )}
                </div>
                <div>
                    <h4 className="font-medium">Fosfaat</h4>
                    <p className="text-lg font-semibold">
                        {applicationFilling.phosphate?.normFilling?.toFixed(
                            0,
                        ) || 0}{" "}
                        kg
                    </p>
                    {applicationFilling.phosphate?.normFillingDetails && (
                        <p className="text-sm text-muted-foreground">
                            {applicationFilling.phosphate.normFillingDetails}
                        </p>
                    )}
                </div>
                <div>
                    <h4 className="font-medium">Stikstof uit dierlijke mest</h4>
                    <p className="text-lg font-semibold">
                        {applicationFilling.manure?.normFilling?.toFixed(0) ||
                            0}{" "}
                        kg
                    </p>
                    {applicationFilling.manure?.normFillingDetails && (
                        <p className="text-sm text-muted-foreground">
                            {applicationFilling.manure.normFillingDetails}
                        </p>
                    )}
                </div>
            </CardContent>
        </Card>
    )
}

function FieldNormsContent(loaderData: Awaited<ReturnType<typeof loader>>) {
    const { fieldNormData, errorMessage } = use(loaderData.asyncData)

    if (errorMessage) {
        return (
            <div className="flex items-center justify-center">
                <Card className="w-[350px]">
                    <CardHeader>
                        <CardTitle>
                            Helaas is het niet mogelijk om de gebruiksnormen uit
                            te rekenen voor dit perceel
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
                                            fieldId: fieldNormData?.b_id,
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

    if (!fieldNormData) {
        return (
            <div className="flex items-center justify-center">
                <Card className="w-[350px]">
                    <CardHeader>
                        <CardTitle>Geen gegevens beschikbaar</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-muted-foreground">
                            Er zijn geen normgegevens gevonden voor dit perceel.
                        </p>
                    </CardContent>
                </Card>
            </div>
        )
    }

    const { norms, normsFilling, fertilizerApplications } = fieldNormData

    return (
        <div className="space-y-6 px-4 pb-16 sm:px-6 lg:px-8">
            <Alert
                className="mb-8 border-amber-200 bg-amber-50 text-amber-800"
                variant="default"
            >
                <AlertTriangle className="h-4 w-4 !text-amber-800" />
                <AlertTitle>Disclaimer</AlertTitle>
                <AlertDescription>
                    Deze getallen zijn uitsluitend bedoeld voor informatieve
                    doeleinden. De getoonde gebruiksnormen zijn indicatief en
                    dienen te worden geverifieerd voor juridische naleving.
                    Raadpleeg altijd de officiële RVO-publicaties en uw adviseur
                    voor definitieve normen.
                </AlertDescription>
            </Alert>

            <div>
                <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                    <NormCard
                        title="Stikstof, werkzaam"
                        norm={norms?.nitrogen}
                        filling={normsFilling?.nitrogen}
                    />
                    <NormCard
                        title="Fosfaat"
                        norm={norms?.phosphate}
                        filling={normsFilling?.phosphate}
                    />
                    <NormCard
                        title="Stikstof uit dierlijke mest"
                        norm={norms?.manure}
                        filling={normsFilling?.manure}
                    />
                </div>

                <Separator className="my-8" />

                <div>
                    <h3 className="text-2xl font-semibold tracking-tight">
                        Mestgift op dit perceel
                    </h3>
                    <p className="text-muted-foreground">
                        Hieronder vindt u een overzicht van de mestgiften op dit
                        perceel en hun bijdrage aan de gebruiksnormen.
                    </p>
                </div>

                <div className="flex flex-cols gap-6 mt-6">
                    {fertilizerApplications?.map((app) => (
                        <FertilizerApplicationCard
                            key={app.p_app_id}
                            application={app}
                            normsFilling={normsFilling}
                        />
                    ))}
                </div>
            </div>
        </div>
    )
}
