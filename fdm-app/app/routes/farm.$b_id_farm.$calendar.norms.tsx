import { createFunctionsForNorms } from "@svenvw/fdm-calculator"
import { getFarm, getFarms, getFields } from "@svenvw/fdm-core"
import {
    data,
    type LoaderFunctionArgs,
    type MetaFunction,
    NavLink,
    useLoaderData,
} from "react-router"
import { FarmTitle } from "~/components/blocks/farm/farm-title"
import { Header } from "~/components/blocks/header/base"
import { HeaderFarm } from "~/components/blocks/header/farm"
import { FarmNorms } from "~/components/blocks/norms/farm-norms"
import { FieldNorms } from "~/components/blocks/norms/field-norms"
import { SidebarInset } from "~/components/ui/sidebar"
import { getSession } from "~/lib/auth.server"
import { getCalendar, getTimeframe } from "~/lib/calendar"
import { clientConfig } from "~/lib/config"
import { handleLoaderError } from "~/lib/error"
import { fdm } from "~/lib/fdm.server"
import { Separator } from "../components/ui/separator"
import { Alert, AlertDescription } from "../components/ui/alert"
import { AlertTriangle } from "lucide-react"
import { Button } from "../components/ui/button"

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
        const fieldOptions = fields.map((field) => {
            if (!field?.b_id || !field?.b_name) {
                throw new Error("Invalid field data structure")
            }
            return {
                b_id: field.b_id,
                b_name: field.b_name,
                b_area: Math.round(field.b_area * 10) / 10,
            }
        })

        if (calendar !== "2025") {
            return {
                farm: farm,
                b_id_farm: b_id_farm,
                b_id: b_id,
                calendar: calendar,
                farmOptions: farmOptions,
                fieldOptions: fieldOptions,
                fieldNorms: undefined,
                farmNorms: undefined,
            }
        }

        // Calculate norms per field
        const functionsForms = createFunctionsForNorms("NL", 2025)

        const fieldNorms = await Promise.all(
            fields.map(async (field) => {
                // Collect the input
                const input = await functionsForms.collectInputForNorms(
                    fdm,
                    session.principal_id,
                    field.b_id,
                    timeframe,
                )

                // Calculate the norms
                const normManure =
                    await functionsForms.calculateNormForManure(input)
                const normPhosphate =
                    await functionsForms.calculateNormForPhosphate(input)
                const normNitrogen = { normValue: 230, normSource: "test" }
                // await functionsForms.calculateNormForNitrogen(input)

                return {
                    b_id: field.b_id,
                    b_area: field.b_area,
                    norms: {
                        manure: normManure,
                        phosphate: normPhosphate,
                        nitrogen: normNitrogen,
                    },
                }
            }),
        )

        // Aggregate the norms to farm level
        const farmNorms =
            await functionsForms.aggregateNormsToFarmLevel(fieldNorms)

        // Return user information from loader
        return {
            farm: farm,
            b_id_farm: b_id_farm,
            b_id: b_id,
            calendar: calendar,
            farmOptions: farmOptions,
            fieldOptions: fieldOptions,
            fieldNorms: fieldNorms,
            farmNorms: farmNorms,
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
            </Header>
            <main>
                <FarmTitle
                    title={"Gebruiksnormen"}
                    description={
                        "Bekijk de gebruiksnormen voor je bedrijf en percelen."
                    }
                />
                {/* Disclaimer */}
                {!loaderData.farmNorms && loaderData.fieldNorms ? (
                    <div className="px-10">
                        <Alert className="mb-8  border-amber-200 bg-amber-50">
                            <AlertTriangle className="h-4 w-4 text-amber-600" />
                            <AlertDescription className="text-amber-800">
                                <strong>Disclaimer:</strong> Deze getallen zijn
                                uitsluitend bedoeld voor informatieve
                                doeleinden. De getoonde gebruiksnormen zijn
                                indicatief en dienen te worden geverifieerd voor
                                juridische naleving. Raadpleeg altijd de
                                officiële RVO-publicaties en uw adviseur voor
                                definitieve normen.
                            </AlertDescription>
                        </Alert>
                    </div>
                ) : null}

                <div className="space-y-6 px-10 pb-16">
                    {loaderData.farmNorms && loaderData.fieldNorms ? (
                        <>
                            <FarmNorms farmNorms={loaderData.farmNorms} />
                            <Separator className="my-8" />
                            <FieldNorms
                                fieldNorms={loaderData.fieldNorms}
                                fieldOptions={loaderData.fieldOptions}
                            />
                        </>
                    ) : (
                        <div className="mx-auto flex h-full w-full items-center flex-col justify-center space-y-6">
                            <div className="flex flex-col space-y-2 text-center">
                                <h1 className="text-2xl font-semibold tracking-tight">
                                    Helaas, nog geen gebruiksnormen beschikbaar
                                    voor {loaderData.calendar}
                                </h1>
                                <p className="text-sm text-muted-foreground">
                                    Op dit moment kunnen we alleen nog de
                                    gebruiksnormen voor 2025 berekenen en
                                    weergeven.
                                </p>
                                <NavLink
                                    to={`/farm/${loaderData.b_id_farm}/2025/norms`}
                                    asChild
                                >
                                    <Button>Ga naar 2025</Button>
                                </NavLink>
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </SidebarInset>
    )
}
