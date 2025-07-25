import {
    calculateNitrogenBalance,
    collectInputForNitrogenBalance,
    type NitrogenBalanceNumeric,
} from "@svenvw/fdm-calculator"
import { getFarm, getField } from "@svenvw/fdm-core"
import {
    ArrowDownToLine,
    ArrowRight,
    ArrowRightLeft,
    ArrowUpFromLine,
    CircleAlert,
    CircleCheck,
} from "lucide-react"
import {
    data,
    type LoaderFunctionArgs,
    type MetaFunction,
    NavLink,
    useLoaderData,
    useLocation,
    useNavigation,
} from "react-router"
import { NitrogenBalanceChart } from "~/components/blocks/balance/nitrogen-chart"
import NitrogenBalanceDetails from "~/components/blocks/balance/nitrogen-details"
import { NitrogenBalanceFallback } from "~/components/blocks/balance/skeletons"
import { Button } from "~/components/ui/button"
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "~/components/ui/card"
import { getSession } from "~/lib/auth.server"
import { Suspense } from "react"
import { Await } from "react-router"
import { getTimeframe } from "~/lib/calendar"
import { clientConfig } from "~/lib/config"
import { fdm } from "~/lib/fdm.server"
import { useCalendarStore } from "~/store/calendar"

// Meta
export const meta: MetaFunction = () => {
    return [
        {
            title: `Stikstof | Perceel | Nutriëntenbalans| ${clientConfig.name}`,
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

    // Get the farm id
    const b_id = params.b_id
    if (!b_id) {
        throw data("invalid: b_id", {
            status: 400,
            statusText: "invalid: b_id",
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

    // Get details of field
    const field = await getField(fdm, session.principal_id, b_id)

    // Return promise directly for React Router v7 Suspense pattern
    const nitrogenBalancePromise = collectInputForNitrogenBalance(
        fdm,
        session.principal_id,
        b_id_farm,
        timeframe,
        String(process.env.FDM_PUBLIC_DATA_URL),
    )
        .then(async (input) => {
            const result = await calculateNitrogenBalance(input)
            return {
                input: input.fields.find(
                    (field: { field: { b_id: string } }) =>
                        field.field.b_id === b_id,
                ),
                result: result.fields.find(
                    (field: { b_id: string }) => field.b_id === b_id,
                ),
                errorMessage: null,
            }
        })
        .catch((error) => ({
            input: null,
            result: null,
            errorMessage: String(error).replace("Error: ", ""),
        }))

    return {
        nitrogenBalanceResult: nitrogenBalancePromise,
        field: field,
        farm: farm,
    }
}

export default function FarmBalanceNitrogenFieldBlock() {
    const loaderData = useLoaderData<typeof loader>()
    const location = useLocation()
    const page = location.pathname
    const calendar = useCalendarStore((state) => state.calendar)

    const { nitrogenBalanceResult, field, farm } = loaderData

    return (
        <div className="space-y-4">
            <Suspense fallback={<NitrogenBalanceFallback />}>
                <Await resolve={nitrogenBalanceResult}>
                    {(resolvedNitrogenBalanceResult) => {
                        const { input, result, errorMessage } =
                            resolvedNitrogenBalanceResult
                        if (!input) {
                            return (
                                <div className="flex items-center justify-center">
                                    <Card className="w-[350px]">
                                        <CardHeader>
                                            <CardTitle>Ongeldig jaar</CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="text-muted-foreground">
                                                <p>
                                                    Dit perceel was niet in
                                                    gebruik voor dit jaar. Als
                                                    dit perceel wel in gebruik
                                                    was, werk dan de startdatum
                                                    bij in de
                                                    perceelsinstelling.
                                                </p>
                                            </div>
                                        </CardContent>
                                        <CardFooter>
                                            <NavLink
                                                to={`../../${calendar}/field/${field.b_id}/`}
                                            >
                                                <Button>
                                                    Naar perceelsinstelling
                                                </Button>
                                            </NavLink>
                                        </CardFooter>
                                    </Card>
                                </div>
                            )
                        }

                        if (errorMessage) {
                            return (
                                <div className="flex items-center justify-center">
                                    <Card className="w-[350px]">
                                        <CardHeader>
                                            <CardTitle>
                                                Helaas is het niet mogelijk om
                                                je balans uit te rekenen
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            {!errorMessage ? (
                                                <div className="text-muted-foreground">
                                                    <p>
                                                        Er is een onbekende fout
                                                        opgetreden. Probeer
                                                        opnieuw of neem contact
                                                        op met Ondersteuning.
                                                    </p>
                                                </div>
                                            ) : errorMessage.match(
                                                  /Missing required soil parameters/,
                                              ) ? (
                                                <div className="text-muted-foreground">
                                                    <p>
                                                        Voor niet alle percelen
                                                        zijn de benodigde
                                                        bodemparameters bekend:
                                                    </p>
                                                    <br />
                                                    <ul className="list-disc list-inside">
                                                        {errorMessage.match(
                                                            /a_n_rt/,
                                                        ) ? (
                                                            <li>
                                                                Totaal
                                                                stikstofgehalte
                                                            </li>
                                                        ) : null}
                                                        {errorMessage.match(
                                                            /b_soiltype_agr/,
                                                        ) ? (
                                                            <li>
                                                                Agrarisch
                                                                bodemtype
                                                            </li>
                                                        ) : null}
                                                        {errorMessage.match(
                                                            /a_c_of|a_som_loi/,
                                                        ) ? (
                                                            <li>
                                                                Organische
                                                                stofgehalte
                                                            </li>
                                                        ) : null}
                                                    </ul>
                                                </div>
                                            ) : (
                                                <div className="text-muted-foreground">
                                                    <p>
                                                        Er is helaas wat
                                                        misgegaan. Probeer
                                                        opnieuw of neem contact
                                                        op met Ondersteuning en
                                                        deel de volgende
                                                        foutmelding:
                                                    </p>
                                                    <div className="mt-8 w-full max-w-2xl">
                                                        <pre className="bg-gray-200 dark:bg-gray-800 p-4 rounded-md overflow-x-auto text-sm text-gray-800 dark:text-gray-200">
                                                            {JSON.stringify(
                                                                {
                                                                    message:
                                                                        errorMessage,
                                                                    page: page,
                                                                    timestamp:
                                                                        new Date(),
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
                            )
                        }

                        return (
                            <>
                                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                                    <Card>
                                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                            <CardTitle className="text-sm font-medium">
                                                Overschot / Doel (Perceel)
                                            </CardTitle>
                                            <ArrowRightLeft className="text-xs text-muted-foreground" />
                                        </CardHeader>
                                        <CardContent>
                                            <div className="text-2xl font-bold">
                                                <div className="flex items-center gap-4">
                                                    <p>
                                                        {`${result.balance} / ${result.target}`}
                                                    </p>
                                                    {result.balance <=
                                                    result.target ? (
                                                        <CircleCheck className="text-green-500 bg-green-100 p-0 rounded-full " />
                                                    ) : (
                                                        <CircleAlert className="text-red-500 bg-red-100 rounded-full " />
                                                    )}
                                                </div>
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
                                                {result.supply.total}
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
                                                {result.removal.total}
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
                                                {result.volatilization.total}
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
                                            <CardDescription>
                                                De stikstofbalans voor{" "}
                                                {field.b_name} van{" "}
                                                {farm.b_name_farm}. De balans is
                                                het verschil tussen de totale
                                                aanvoer, afvoer en emissie van
                                                stikstof. Een positieve balans
                                                betekent een overschot aan
                                                stikstof, een negatieve balans
                                                een tekort.
                                            </CardDescription>
                                        </CardHeader>
                                        <CardContent className="pl-2">
                                            <NitrogenBalanceChart
                                                balance={result.balance}
                                                supply={result.supply.total}
                                                removal={result.removal.total}
                                                volatilization={
                                                    result.volatilization.total
                                                }
                                            />
                                        </CardContent>
                                    </Card>
                                    <Card className="col-span-3">
                                        <CardHeader>
                                            <CardTitle>Posten</CardTitle>
                                            <CardDescription />
                                        </CardHeader>
                                        <CardContent>
                                            <div className="space-y-8">
                                                <NitrogenBalanceDetails
                                                    balanceData={result}
                                                    fieldInput={input}
                                                />
                                            </div>
                                        </CardContent>
                                    </Card>
                                </div>
                            </>
                        )
                    }}
                </Await>
            </Suspense>
        </div>
    )
}
