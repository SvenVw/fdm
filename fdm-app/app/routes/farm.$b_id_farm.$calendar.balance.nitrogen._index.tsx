import {
    data,
    useLoaderData,
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
    // const nitrogenBalanceInput = await collectInputForNitrogenBalance(
    //     fdm,
    //     session.principal_id,
    //     b_id_farm,
    //     timeframe,
    //     String(process.env.FDM_PUBLIC_DATA_URL),
    // )
    // console.log(nitrogenBalanceInput)

    // const nitrogenBalanceResult = await  calculateNitrogenBalance(nutrientBalanceInput)

    // Mock the output of nutrientBalanceResult
    const nitrogenBalanceResult: NitrogenBalanceNumeric =
        mockNitrogenBalanceResult

    return {
        nitrogenBalanceResult: nitrogenBalanceResult,
        fields: fields,
    }
}

export default function FarmBalanceNitrogenOverviewBlock() {
    const loaderData = useLoaderData<typeof loader>()
    const { nitrogenBalanceResult, fields } = loaderData

    return (
        <div className="space-y-4">
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
                            {nitrogenBalanceResult.fields.map((field) => (
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
                                        <p className="text-sm font-medium leading-none">
                                            {fields.find(
                                                (f) => f.b_id === field.b_id,
                                            )?.b_name || "Test perceel"}
                                        </p>
                                        <p className="text-sm text-muted-foreground">
                                            {fields.find(
                                                (f) => f.b_id === field.b_id,
                                            )?.b_area || "4 ha"}
                                        </p>
                                    </div>
                                    <div className="ml-auto font-medium">
                                        +{field.balance}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}

const mockNitrogenBalanceResult: NitrogenBalanceNumeric = {
    balance: 15.5, // Overall farm balance
    supply: 150.0, // Total farm supply
    removal: -120.0, // Total farm removal (negative as it's an output)
    volatilization: -14.5, // Total farm volatilization (negative as it's a loss)
    fields: [
        {
            b_id: "field_1_uuid",
            balance: 10.0,
            supply: {
                total: 160.0,
                fertilizers: {
                    total: 120.0,
                    mineral: {
                        total: 80.0,
                        applications: [
                            { id: "mineral_app_1", value: 50.0 },
                            { id: "mineral_app_2", value: 30.0 },
                        ],
                    },
                    manure: {
                        total: 40.0,
                        applications: [{ id: "manure_app_1", value: 40.0 }],
                    },
                    compost: {
                        total: 0.0,
                        applications: [],
                    },
                },
                fixation: {
                    total: 25.0,
                    cultivations: [{ id: "cult_legume_1", value: 25.0 }],
                },
                deposition: {
                    total: 5.0,
                },
                mineralisation: {
                    total: 10.0,
                    cultivations: [{ id: "cult_main_1", value: 10.0 }],
                },
            },
            removal: {
                total: -130.0,
                harvests: {
                    total: -110.0,
                    harvests: [{ id: "harvest_1", value: -110.0 }],
                },
                residues: {
                    total: -20.0,
                    cultivations: [
                        {
                            id: "cult_main_1_residue",
                            value: -20.0,
                        },
                    ],
                },
            },
            volatilization: {
                total: -20.0,
                ammonia: {
                    total: -20.0,
                    fertilizers: {
                        total: -15.0,
                        mineral: {
                            total: -5.0,
                            applications: [
                                {
                                    id: "mineral_app_1_vol",
                                    value: -5.0,
                                },
                            ],
                        },
                        manure: {
                            total: -10.0,
                            applications: [
                                {
                                    id: "manure_app_1_vol",
                                    value: -10.0,
                                },
                            ],
                        },
                    },
                    residues: {
                        total: -5.0,
                        cultivations: [
                            {
                                id: "cult_main_1_residue_vol",
                                value: -5.0,
                            },
                        ],
                    },
                    grazing: undefined,
                },
            },
        },
        {
            b_id: "field_2_uuid",
            balance: 21.0,
            supply: {
                total: 140.0,
                fertilizers: {
                    total: 100.0,
                    mineral: {
                        total: 70.0,
                        applications: [{ id: "mineral_app_3", value: 70.0 }],
                    },
                    manure: {
                        total: 30.0,
                        applications: [{ id: "manure_app_2", value: 30.0 }],
                    },
                    compost: {
                        total: 0.0,
                        applications: [],
                    },
                },
                fixation: {
                    total: 20.0,
                    cultivations: [{ id: "cult_legume_2", value: 20.0 }],
                },
                deposition: {
                    total: 7.0,
                },
                mineralisation: {
                    total: 13.0,
                    cultivations: [{ id: "cult_main_2", value: 13.0 }],
                },
            },
            removal: {
                total: -100.0,
                harvests: {
                    total: -90.0,
                    harvests: [{ id: "harvest_2", value: -90.0 }],
                },
                residues: {
                    total: -10.0,
                    cultivations: [
                        {
                            id: "cult_main_2_residue",
                            value: -10.0,
                        },
                    ],
                },
            },
            volatilization: {
                total: -19.0,
                ammonia: {
                    total: -19.0,
                    fertilizers: {
                        total: -14.0,
                        mineral: {
                            total: -4.0,
                            applications: [
                                {
                                    id: "mineral_app_3_vol",
                                    value: -4.0,
                                },
                            ],
                        },
                        manure: {
                            total: -10.0,
                            applications: [
                                {
                                    id: "manure_app_2_vol",
                                    value: -10.0,
                                },
                            ],
                        },
                    },
                    residues: {
                        total: -5.0,
                        cultivations: [
                            {
                                id: "cult_main_2_residue_vol",
                                value: -5.0,
                            },
                        ],
                    },
                    grazing: undefined,
                },
            },
        },
    ],
}
