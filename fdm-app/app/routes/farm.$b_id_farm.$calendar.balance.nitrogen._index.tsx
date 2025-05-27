import {
    type NitrogenBalanceNumeric,
    calculateNitrogenBalance,
    collectInputForNitrogenBalance,
} from "@svenvw/fdm-calculator"
import { getFarm, getFields } from "@svenvw/fdm-core"
import {
    ArrowDownToLine,
    ArrowRight,
    ArrowRightLeft,
    ArrowUpFromLine,
    Check,
    CircleAlert,
    CircleCheck,
    House,
} from "lucide-react"
import {
    type LoaderFunctionArgs,
    type MetaFunction,
    NavLink,
    data,
    useLoaderData,
    useLocation,
    useNavigation,
} from "react-router"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "~/components/ui/card"
import { getSession } from "~/lib/auth.server"
import { clientConfig } from "~/lib/config"
import { fdm } from "~/lib/fdm.server"
import { NitrogenBalanceChart } from "../components/custom/balance/nitrogen-chart"
import { LoadingSpinner } from "../components/custom/loadingspinner"
import { Skeleton } from "../components/ui/skeleton"
import { getTimeframe } from "../lib/calendar"

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
        farm: farm,
        fields: fields,
        errorMessage: errorMessage,
    }
}

export default function FarmBalanceNitrogenOverviewBlock() {
    const loaderData = useLoaderData<typeof loader>()
    const location = useLocation()
    const navigation = useNavigation()
    const page = location.pathname
    const isLoading = navigation.state === "loading"

    const { nitrogenBalanceResult, farm, fields, errorMessage } = loaderData
    const fieldsMap = new Map(fields.map((f) => [f.b_id, f]))
    return (
        <div className="space-y-4">
            {nitrogenBalanceResult ? (
                <>
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">
                                    Overschot / Doel (Bedrijf)
                                </CardTitle>
                                <ArrowRightLeft className="text-xs text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">
                                    {isLoading ? (
                                        <LoadingSpinner />
                                    ) : (
                                        <div className="flex items-center gap-4">
                                            <p>
                                                {`${nitrogenBalanceResult.balance} / ${nitrogenBalanceResult.target}`}
                                            </p>
                                            {nitrogenBalanceResult.balance <=
                                            nitrogenBalanceResult.target ? (
                                                <CircleCheck className="text-green-500 bg-green-100 p-0 rounded-full " />
                                            ) : (
                                                <CircleAlert className="text-red-500 bg-red-100 rounded-full " />
                                            )}
                                        </div>
                                    )}
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
                                    {isLoading ? (
                                        <LoadingSpinner />
                                    ) : (
                                        nitrogenBalanceResult.supply
                                    )}
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
                                    {isLoading ? (
                                        <LoadingSpinner />
                                    ) : (
                                        nitrogenBalanceResult.removal
                                    )}
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
                                    {isLoading ? <LoadingSpinner /> : "-"}
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    Berekening van emissie volgt later
                                </p>
                            </CardContent>
                        </Card>
                    </div>
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                        <Card className="col-span-4">
                            <CardHeader>
                                <CardTitle>Balans</CardTitle>
                                <CardDescription>
                                    De stikstofbalans voor alle percelen van{" "}
                                    {farm.b_name_farm}. De balans is het
                                    verschil tussen de totale aanvoer, afvoer en
                                    emissie van stikstof. Een positieve balans
                                    betekent een overschot aan stikstof, een
                                    negatieve balans een tekort.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="pl-2">
                                {isLoading ? (
                                    <div className="flex items-center justify-center">
                                        <LoadingSpinner />
                                    </div>
                                ) : (
                                    <NitrogenBalanceChart
                                        balance={nitrogenBalanceResult.balance}
                                        supply={nitrogenBalanceResult.supply}
                                        removal={nitrogenBalanceResult.removal}
                                        emission={
                                            nitrogenBalanceResult.emission
                                        }
                                    />
                                )}
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
                                    {isLoading
                                        ? fields.map((field) => {
                                              return (
                                                  <div
                                                      className="flex items-center"
                                                      key={field.b_id}
                                                  >
                                                      <div className="ml-4 space-y-1">
                                                          <Skeleton className="h-4 w-[250px]" />
                                                      </div>
                                                      <div className="ml-auto">
                                                          <Skeleton className="h-4 w-[50px]" />
                                                      </div>
                                                  </div>
                                              )
                                          })
                                        : nitrogenBalanceResult.fields.map(
                                              (field) => {
                                                  const fieldData =
                                                      fieldsMap.get(field.b_id)
                                                  return (
                                                      <div
                                                          className="flex items-center"
                                                          key={field.b_id}
                                                      >
                                                          {field.balance <=
                                                          field.target ? (
                                                              <CircleCheck className="text-green-500 bg-green-100 p-0 rounded-full w-6 h-6" />
                                                          ) : (
                                                              <CircleAlert className="text-red-500 bg-red-100 p-0 rounded-full w-6 h-6" />
                                                          )}

                                                          <div className="ml-4 space-y-1">
                                                              <NavLink
                                                                  to={`./${field.b_id}`}
                                                              >
                                                                  <p className="text-sm font-medium leading-none hover:underline">
                                                                      {
                                                                          fieldData?.b_name
                                                                      }
                                                                  </p>
                                                              </NavLink>
                                                              <p className="text-sm text-muted-foreground">
                                                                  {
                                                                      fieldData?.b_area
                                                                  }{" "}
                                                                  ha
                                                              </p>
                                                          </div>
                                                          <div className="ml-auto font-medium">
                                                              {field.balance} /{" "}
                                                              {field.target}
                                                          </div>
                                                      </div>
                                                  )
                                              },
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
