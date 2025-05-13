import {
    data,
    NavLink,
    useLoaderData,
    useLocation,
    type LoaderFunctionArgs,
    type MetaFunction,
} from "react-router"
import { clientConfig } from "~/lib/config"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "~/components/ui/card"
import { getSession } from "~/lib/auth.server"
import { getFarm, getFields } from "@svenvw/fdm-core"
import { fdm } from "~/lib/fdm.server"
import {
    calculateNitrogenBalance,
    collectInputForNitrogenBalance,
    type NitrogenBalanceNumeric,
} from "@svenvw/fdm-calculator"
import { getTimeframe } from "../lib/calendar"
import {
    ArrowDownToLine,
    ArrowRight,
    ArrowUpFromLine,
    House,
} from "lucide-react"
import { timestamp } from "drizzle-orm/gel-core"

// Meta
export const meta: MetaFunction = () => {
    return [
        {
            title: `Stikstof | Bedrijf | Nutriëntenbalans| ${clientConfig.name}`,
        },
        {
            name: "description",
            content: "Bekijk stikstof voor je nutriëntenbalans.",
        },
    ]
}

export async function loader({ request, params }: LoaderFunctionArgs) {
    // Get the farm id
    const b_id_farm = params.b_id_farm
    if (!b_id_farm) {
        throw data("invalid: b_id_farm", {
            status: 400,
            statusText: "invalid: b_id_farm",
        })
    }

    // Get the session
    const session = await getSession(request)

    // Get timeframe from calendar store
    const timeframe = getTimeframe(params)

    // Get details of farm
    const farm = await getFarm(fdm, session.principal_id, b_id_farm)
    if (!farm) {
        throw data("not found: b_id_farm", {
            status: 404,
            statusText: "not found: b_id_farm",
        })
    }

    // Get details of fields
    const fields = await getFields(fdm, session.principal_id, b_id_farm)

    // Collect input data for nutrient balance calculation
    const nitrogenBalanceInput = await collectInputForNitrogenBalance(
        fdm,
        session.principal_id,
        b_id_farm,
        timeframe,
        String(process.env.FDM_PUBLIC_DATA_URL),
    )

    let nitrogenBalanceResult = null as NitrogenBalanceNumeric | null
    let errorMessage = null as string | null
    try {
        nitrogenBalanceResult =
            await calculateNitrogenBalance(nitrogenBalanceInput)
    } catch (error) {
        errorMessage = String(error).replace("Error: ", "")
    }

    return {
        nitrogenBalanceInput: nitrogenBalanceInput,
        nitrogenBalanceResult: nitrogenBalanceResult,
        fields: fields,
        errorMessage: errorMessage,
    }
}

export default function FarmBalanceNitrogenOverviewBlock() {
    const loaderData = useLoaderData<typeof loader>()
    const location = useLocation()
    const page = location.pathname
    const { nitrogenBalanceResult, fields, errorMessage } = loaderData

    return (
        <div className="space-y-4">
            {nitrogenBalanceResult ? (
                <>
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">
                                    Bedrijfsoverschot
                                </CardTitle>
                                <House className="text-xs text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">
                                    +{nitrogenBalanceResult.balance}
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    kg N / ha
                                </p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">
                                    Aanvoer
                                </CardTitle>
                                <ArrowDownToLine className="text-xs text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">
                                    {" "}
                                    +{nitrogenBalanceResult.supply}
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    kg N / ha
                                </p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">
                                    Afvoer
                                </CardTitle>
                                <ArrowRight className="text-xs text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">
                                    {nitrogenBalanceResult.removal}
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    kg N / ha
                                </p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">
                                    Emissie
                                </CardTitle>
                                <ArrowUpFromLine className="text-xs text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">
                                    {nitrogenBalanceResult.volatilization}
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    kg N / ha
                                </p>
                            </CardContent>
                        </Card>
                    </div>
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                        <Card className="col-span-4">
                            <CardHeader>
                                <CardTitle>Balans</CardTitle>
                            </CardHeader>
                            <CardContent className="pl-2">
                                {/* <Overview /> */}
                            </CardContent>
                        </Card>
                        <Card className="col-span-3">
                            <CardHeader>
                                <CardTitle>Percelen</CardTitle>
                                <CardDescription />
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-8">
                                    {nitrogenBalanceResult.fields.map(
                                        (field) => (
                                            <div
                                                className="flex items-center"
                                                key={field.b_id}
                                            >
                                                {/* <Avatar className="h-9 w-9">
                                    <AvatarImage
                                        src="/avatars/01.png"
                                        alt="Avatar"
                                    />
                                    <AvatarFallback>OM</AvatarFallback>
                                </Avatar> */}
                                                <div className="ml-4 space-y-1">
                                                    <NavLink
                                                        to={`./${field.b_id}`}
                                                    >
                                                        <p className="text-sm font-medium leading-none">
                                                            {
                                                                fields.find(
                                                                    (f) =>
                                                                        f.b_id ===
                                                                        field.b_id,
                                                                )?.b_name
                                                            }
                                                        </p>
                                                    </NavLink>
                                                    <p className="text-sm text-muted-foreground">
                                                        {
                                                            fields.find(
                                                                (f) =>
                                                                    f.b_id ===
                                                                    field.b_id,
                                                            )?.b_area
                                                        }
                                                    </p>
                                                </div>
                                                <div className="ml-auto font-medium">
                                                    +{field.balance}
                                                </div>
                                            </div>
                                        ),
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </>
            ) : (
                <div className="flex items-center justify-center">
                    <Card className="w-[350px]">
                        <CardHeader>
                            <CardTitle>
                                Helaas is het niet mogelijk om je balans uit te
                                rekenen
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {!errorMessage ? (
                                <div className="text-muted-foreground">
                                    <p>
                                        Er is een onbekende fout opgetreden.
                                        Probeer opnieuw of neem contact op met
                                        Ondersteuning.
                                    </p>
                                </div>
                            ) : errorMessage.match(
                                  /Missing required soil parameters/,
                              ) ? (
                                <div className="text-muted-foreground">
                                    <p>
                                        Voor niet alle percelen zijn de
                                        benodigde bodemparameters bekend:
                                    </p>
                                    <br />
                                    <ul className="list-disc list-inside">
                                        {errorMessage.match(/a_n_rt/) ? (
                                            <li>Totaal stikstofgehalte</li>
                                        ) : null}
                                        {errorMessage.match(
                                            /b_soiltype_agr/,
                                        ) ? (
                                            <li>Agrarisch bodemtype</li>
                                        ) : null}
                                        {errorMessage.match(
                                            /a_c_of|a_som_loi/,
                                        ) ? (
                                            <li>Organische stofgehalte</li>
                                        ) : null}
                                    </ul>
                                </div>
                            ) : (
                                <div className="text-muted-foreground">
                                    <p>
                                        Er is helaas wat misgegaan. Probeer
                                        opnieuw of neem contact op met
                                        Ondersteuning en deel de volgende
                                        foutmelding:
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
                            )}
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    )
}
