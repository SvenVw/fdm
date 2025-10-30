import { Suspense } from "react"
import { Await, NavLink } from "react-router-dom"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "~/components/ui/card"
import {
    Item,
    ItemContent,
    ItemDescription,
    ItemGroup,
    ItemSeparator,
    ItemTitle,
} from "~/components/ui/item"
import { Progress } from "~/components/ui/progress"
import { Skeleton } from "~/components/ui/skeleton"
import { Spinner } from "~/components/ui/spinner"
import type {
    GebruiksnormResult,
    NitrogenBalanceNumeric,
    NutrientAdvice,
    NormFilling,
    Dose,
} from "@svenvw/fdm-calculator"
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "~/components/ui/tooltip"

interface FertilizerApplicationMetricsData {
    norms: {
        value: {
            manure: GebruiksnormResult
            phosphate: GebruiksnormResult
            nitrogen: GebruiksnormResult
        }
        filling: {
            manure: NormFilling
            phosphate: NormFilling
            nitrogen: NormFilling
        }
    }
    nitrogenBalance: Promise<NitrogenBalanceNumeric> | undefined
    nutrientAdvice: NutrientAdvice
    dose: Dose
    b_id: string
    b_id_farm: string
    calendar: string
    errorMessage: string | undefined
}

export function FertilizerApplicationMetricsCard(
    fertilizerApplicationMetricsData: FertilizerApplicationMetricsData,
) {
    const getNormsProgressColor = (current: number, total: number) => {
        const percentage = (current / total) * 100
        if (percentage > 100) return "red-500"
        return "green-500"
    }

    const getAdviceProgressColor = (current: number, total: number) => {
        const percentage = (current / total) * 100
        if (percentage < 80) return "orange-500"
        if (percentage >= 80 && percentage <= 105) return "green-500"
        if (percentage > 105) return "orange-500"
        return "gray-500" // Default or error color
    }

    const dose = fertilizerApplicationMetricsData.dose

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    Bemestingsplanner
                </CardTitle>
                <CardDescription>
                    Bekijk de impact van uw bemestingen.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                    <ItemGroup>
                        <ItemSeparator />
                        <Item>
                            <ItemContent>
                                <ItemTitle className="hover:underline">
                                    <NavLink
                                        to={`/farm/${fertilizerApplicationMetricsData.b_id_farm}/${fertilizerApplicationMetricsData.calendar}/norms/${fertilizerApplicationMetricsData.b_id}`}
                                    >
                                        Gebruiksnormen
                                    </NavLink>
                                </ItemTitle>
                            </ItemContent>
                            <ItemDescription>
                                <Suspense fallback={<NormsSkeleton />}>
                                    <Await
                                        errorElement={
                                            <div>
                                                Helaas, er is wat misgegaan met
                                                de berekening
                                            </div>
                                        }
                                        resolve={
                                            fertilizerApplicationMetricsData.norms
                                        }
                                    >
                                        {(norms) => (
                                            <div className="flex flex-col space-y-2">
                                                <div className="grid grid-cols-[1fr_auto] items-center">
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <p className="whitespace-nowrap px-2">
                                                                Stikstof
                                                            </p>
                                                        </TooltipTrigger>
                                                        <TooltipContent>
                                                            <p>
                                                                Werkzame
                                                                stikstof volgens
                                                                forfaitaire
                                                                gehalten
                                                            </p>
                                                        </TooltipContent>
                                                    </Tooltip>
                                                    <span className="text-right whitespace-nowrap px-2">
                                                        {norms.filling.nitrogen.toFixed(
                                                            0,
                                                        )}{" "}
                                                        /{" "}
                                                        {norms.value.nitrogen.toFixed(
                                                            0,
                                                        )}{" "}
                                                        kg N
                                                    </span>
                                                </div>
                                                <Progress
                                                    value={
                                                        (norms.filling
                                                            .nitrogen /
                                                            norms.value
                                                                .nitrogen) *
                                                        100
                                                    }
                                                    colorBar={getNormsProgressColor(
                                                        norms.filling.nitrogen,
                                                        norms.value.nitrogen,
                                                    )}
                                                    className="h-2"
                                                />

                                                <div className="grid grid-cols-[1fr_auto] items-center">
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <p className="whitespace-nowrap px-2">
                                                                Fosfaat
                                                            </p>
                                                        </TooltipTrigger>
                                                        <TooltipContent>
                                                            <p>
                                                                Fosfaataanvoer
                                                                incl. mogelijke
                                                                stimuleringsregeling
                                                            </p>
                                                        </TooltipContent>
                                                    </Tooltip>
                                                    <span className="text-right whitespace-nowrap px-2">
                                                        {norms.filling.phosphate.toFixed(
                                                            0,
                                                        )}{" "}
                                                        /{" "}
                                                        {norms.value.phosphate.toFixed(
                                                            0,
                                                        )}{" "}
                                                        kg P₂O₅
                                                    </span>
                                                </div>
                                                <Progress
                                                    value={
                                                        (norms.filling
                                                            .phosphate /
                                                            norms.value
                                                                .phosphate) *
                                                        100
                                                    }
                                                    colorBar={getNormsProgressColor(
                                                        norms.filling.phosphate,
                                                        norms.value.phosphate,
                                                    )}
                                                    className="h-2"
                                                />

                                                <div className="grid grid-cols-[1fr_auto] items-center">
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <p className="whitespace-nowrap px-2">
                                                                Dierlijke mest
                                                            </p>
                                                        </TooltipTrigger>
                                                        <TooltipContent>
                                                            <p>
                                                                Totaal stikstof
                                                                via dierlijke
                                                                mest
                                                            </p>
                                                        </TooltipContent>
                                                    </Tooltip>
                                                    <span className="text-right whitespace-nowrap px-2">
                                                        {norms.filling.manure.toFixed(
                                                            0,
                                                        )}{" "}
                                                        /{" "}
                                                        {norms.value.manure.toFixed(
                                                            0,
                                                        )}{" "}
                                                        kg N
                                                    </span>
                                                </div>
                                                <Progress
                                                    value={
                                                        (norms.filling.manure /
                                                            norms.value
                                                                .manure) *
                                                        100
                                                    }
                                                    colorBar={getNormsProgressColor(
                                                        norms.filling.manure
                                                            .normFilling,
                                                        norms.value.manure,
                                                    )}
                                                    className="h-2"
                                                />
                                            </div>
                                        )}
                                    </Await>
                                </Suspense>
                            </ItemDescription>
                        </Item>
                    </ItemGroup>
                    <ItemGroup>
                        <ItemSeparator />
                        <Item>
                            <ItemContent>
                                <ItemTitle className="hover:underline">
                                    <NavLink
                                        to={`/farm/${fertilizerApplicationMetricsData.b_id_farm}/${fertilizerApplicationMetricsData.calendar}/balance/nitrogen/${fertilizerApplicationMetricsData.b_id}`}
                                    >
                                        Stikstofbalans
                                    </NavLink>
                                </ItemTitle>
                            </ItemContent>
                            <ItemDescription>
                                <Suspense
                                    fallback={<NitrogenBalanceSkeleton />}
                                >
                                    <Await
                                        errorElement={
                                            <div>
                                                Helaas, er is wat misgegaan met
                                                de berekening
                                            </div>
                                        }
                                        resolve={
                                            fertilizerApplicationMetricsData.nitrogenBalance
                                        }
                                    >
                                        {(nitrogenBalance) => {
                                            const task =
                                                nitrogenBalance.balance.target -
                                                nitrogenBalance.balance.balance
                                            return (
                                                <div className="flex flex-col space-y-2">
                                                    {/* Simplified Flow (Top Section) */}
                                                    <div className="grid grid-cols-[1fr_auto] items-center">
                                                        <Tooltip>
                                                            <TooltipTrigger
                                                                asChild
                                                            >
                                                                <p className="whitespace-nowrap px-2">
                                                                    Aanvoer
                                                                </p>
                                                            </TooltipTrigger>
                                                            <TooltipContent>
                                                                <p>
                                                                    Totaal
                                                                    stikstof via
                                                                    bemesting,
                                                                    depositie,
                                                                    mineralisatie
                                                                    en fixatie
                                                                </p>
                                                            </TooltipContent>
                                                        </Tooltip>

                                                        <span className="font-semibold text-right whitespace-nowrap px-2">
                                                            {nitrogenBalance.balance.supply.total.toFixed(
                                                                0,
                                                            )}{" "}
                                                            kg N
                                                        </span>
                                                    </div>
                                                    <div className="grid grid-cols-[1fr_auto] items-center">
                                                        <Tooltip>
                                                            <TooltipTrigger
                                                                asChild
                                                            >
                                                                <p className="whitespace-nowrap px-2">
                                                                    Afvoer
                                                                </p>
                                                            </TooltipTrigger>
                                                            <TooltipContent>
                                                                <p>
                                                                    Totaal
                                                                    stikstof via
                                                                    oogst en
                                                                    gewasresten
                                                                </p>
                                                            </TooltipContent>
                                                        </Tooltip>
                                                        <span className="font-semibold text-right whitespace-nowrap px-2">
                                                            {nitrogenBalance.balance.removal.total.toFixed(
                                                                0,
                                                            )}{" "}
                                                            kg N
                                                        </span>
                                                    </div>
                                                    <div className="grid grid-cols-[1fr_auto] items-center">
                                                        <Tooltip>
                                                            <TooltipTrigger
                                                                asChild
                                                            >
                                                                <p className="whitespace-nowrap px-2">
                                                                    Emissie
                                                                </p>
                                                            </TooltipTrigger>
                                                            <TooltipContent>
                                                                <p>
                                                                    Totaal
                                                                    stikstof via
                                                                    gasvormige
                                                                    verliezen
                                                                    (NH3)
                                                                </p>
                                                            </TooltipContent>
                                                        </Tooltip>
                                                        <span className="font-semibold text-right whitespace-nowrap px-2">
                                                            {nitrogenBalance.balance.emission.total.toFixed(
                                                                0,
                                                            )}{" "}
                                                            kg N
                                                        </span>
                                                    </div>
                                                    <ItemSeparator className="col-span-2" />{" "}
                                                    {/* Separator for clarity */}
                                                    {/* Prominent Result (Bottom Section) */}
                                                    <div className="grid grid-cols-[1fr_auto] items-center">
                                                        <p className="text-xl font-bold whitespace-nowrap px-2">
                                                            Balans
                                                        </p>
                                                        <span className="text-xl font-bold text-right whitespace-nowrap px-2">
                                                            {nitrogenBalance.balance.balance.toFixed(
                                                                0,
                                                            )}{" "}
                                                            kg N
                                                        </span>
                                                    </div>
                                                    <div className="grid grid-cols-[1fr_auto] items-center">
                                                        <p className="whitespace-nowrap px-2">
                                                            Streefwaarde
                                                        </p>
                                                        <span className="font-semibold text-right whitespace-nowrap px-2">
                                                            {nitrogenBalance.balance.target.toFixed(
                                                                0,
                                                            )}{" "}
                                                            kg N
                                                        </span>
                                                    </div>
                                                    <ItemSeparator className="col-span-2" />{" "}
                                                    <div className="grid grid-cols-[1fr_auto] items-center">
                                                        <Tooltip>
                                                            <TooltipTrigger
                                                                asChild
                                                            >
                                                                <p className="text-xl font-bold whitespace-nowrap px-2">
                                                                    {nitrogenBalance
                                                                        .balance
                                                                        .task <
                                                                    0
                                                                        ? "Opgave"
                                                                        : "Ruimte"}
                                                                </p>
                                                            </TooltipTrigger>
                                                            <TooltipContent>
                                                                <p>
                                                                    {nitrogenBalance
                                                                        .balance
                                                                        .task <
                                                                    0
                                                                        ? "Hoeveelheid totaal stikstof die verminderd moet worden om het doel te halen"
                                                                        : "Hoeveelheid totaal stikstof die nog over waarbij het doel gehaald kan worden"}
                                                                </p>
                                                            </TooltipContent>
                                                        </Tooltip>
                                                        <span
                                                            className={`text-xl font-bold text-right whitespace-nowrap px-2 ${
                                                                task < 0
                                                                    ? "text-red-500"
                                                                    : "text-green-500"
                                                            }`}
                                                        >
                                                            {task.toFixed(0)} kg
                                                            N
                                                        </span>
                                                    </div>
                                                </div>
                                            )
                                        }}
                                    </Await>
                                </Suspense>
                            </ItemDescription>
                        </Item>
                    </ItemGroup>
                    <ItemGroup>
                        <ItemSeparator />
                        <Item>
                            <ItemContent>
                                <ItemTitle className="hover:underline">
                                    <NavLink
                                        to={`/farm/${fertilizerApplicationMetricsData.b_id_farm}/${fertilizerApplicationMetricsData.calendar}/nutrient_advice/${fertilizerApplicationMetricsData.b_id}`}
                                    >
                                        Bemestingsadvies
                                    </NavLink>
                                </ItemTitle>
                            </ItemContent>
                            <ItemDescription>
                                <Suspense fallback={<NutrientAdviceSkeleton />}>
                                    <Await
                                        errorElement={
                                            <div>
                                                Helaas, er is wat misgegaan met
                                                de berekening
                                            </div>
                                        }
                                        resolve={
                                            fertilizerApplicationMetricsData.nutrientAdvice
                                        }
                                    >
                                        {(nutrientAdvice) => (
                                            <div className="flex flex-col space-y-2">
                                                <div className="grid grid-cols-[1fr_auto] items-center">
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <p className="whitespace-nowrap px-2">
                                                                Stikstof
                                                            </p>
                                                        </TooltipTrigger>
                                                        <TooltipContent>
                                                            <p>
                                                                Werkzame
                                                                stikstof
                                                            </p>
                                                        </TooltipContent>
                                                    </Tooltip>
                                                    <span className="text-right whitespace-nowrap px-2">
                                                        {dose.p_dose_n.toFixed(
                                                            0,
                                                        )}{" "}
                                                        /{" "}
                                                        {nutrientAdvice.d_n_req.toFixed(
                                                            0,
                                                        )}{" "}
                                                        kg N
                                                    </span>
                                                </div>
                                                <Progress
                                                    value={
                                                        (dose.p_dose_n /
                                                            nutrientAdvice.d_n_req) *
                                                        100
                                                    }
                                                    colorBar={getAdviceProgressColor(
                                                        dose.p_dose_n,
                                                        nutrientAdvice.d_n_req,
                                                    )}
                                                    className="h-2"
                                                />

                                                <div className="grid grid-cols-[1fr_auto] items-center">
                                                    <p className="whitespace-nowrap px-2">
                                                        Fosfaat
                                                    </p>
                                                    <span className="text-right whitespace-nowrap px-2">
                                                        {dose.p_dose_p.toFixed(
                                                            0,
                                                        )}{" "}
                                                        /{" "}
                                                        {nutrientAdvice.d_p_req.toFixed(
                                                            0,
                                                        )}{" "}
                                                        kg P₂O₅
                                                    </span>
                                                </div>
                                                <Progress
                                                    value={
                                                        (dose.p_dose_p /
                                                            nutrientAdvice.d_p_req) *
                                                        100
                                                    }
                                                    colorBar={getAdviceProgressColor(
                                                        dose.p_dose_p,
                                                        nutrientAdvice.d_p_req,
                                                    )}
                                                    className="h-2"
                                                />

                                                <div className="grid grid-cols-[1fr_auto] items-center">
                                                    <p className="whitespace-nowrap px-2">
                                                        Kalium
                                                    </p>
                                                    <span className="text-right whitespace-nowrap px-2">
                                                        {dose.p_dose_k.toFixed(
                                                            0,
                                                        )}{" "}
                                                        /{" "}
                                                        {nutrientAdvice.d_k_req.toFixed(
                                                            0,
                                                        )}{" "}
                                                        kg K₂O
                                                    </span>
                                                </div>
                                                <Progress
                                                    value={
                                                        (dose.p_dose_k /
                                                            nutrientAdvice.d_k_req) *
                                                        100
                                                    }
                                                    colorBar={getAdviceProgressColor(
                                                        dose.p_dose_k,
                                                        nutrientAdvice.d_k_req,
                                                    )}
                                                    className="h-2"
                                                />
                                            </div>
                                        )}
                                    </Await>
                                </Suspense>
                            </ItemDescription>
                        </Item>
                    </ItemGroup>
                </div>
            </CardContent>
        </Card>
    )
}

const NormsSkeleton = () => (
    <div className="flex flex-col space-y-2">
        <div className="grid grid-cols-[1fr_auto] items-center">
            <p className="whitespace-nowrap px-2">Stikstof</p>
            <span className="text-right whitespace-nowrap px-2">
                {<Spinner className="h-3" />} kg N
            </span>
        </div>
        <Skeleton className="h-2 w-full" />

        <div className="grid grid-cols-[1fr_auto] items-center">
            <p className="whitespace-nowrap px-2">Fosfaat</p>
            <span className="text-right whitespace-nowrap px-2">
                {<Spinner className="h-3" />} kg P₂O₅
            </span>
        </div>
        <Skeleton className="h-2 w-full" />

        <div className="grid grid-cols-[1fr_auto] items-center">
            <p className="whitespace-nowrap px-2">Dierlijke mest</p>
            <span className="text-right whitespace-nowrap px-2">
                {<Spinner className="h-3" />} kg N
            </span>
        </div>
        <Skeleton className="h-2 w-full" />
    </div>
)
const NitrogenBalanceSkeleton = () => (
    <div className="flex flex-col space-y-2">
        <div className="grid grid-cols-[1fr_auto] items-center">
            <p className="whitespace-nowrap px-2">Aanvoer</p>
            <span className="font-semibold text-right whitespace-nowrap px-2">
                <Spinner />
            </span>
        </div>
        <div className="grid grid-cols-[1fr_auto] items-center">
            <p className="whitespace-nowrap px-2">Afvoer</p>
            <span className="font-semibold text-right whitespace-nowrap px-2">
                <Spinner />
            </span>
        </div>
        <div className="grid grid-cols-[1fr_auto] items-center">
            <p className="whitespace-nowrap px-2">Emissie</p>
            <span className="font-semibold text-right whitespace-nowrap px-2">
                <Spinner />
            </span>
        </div>
        <ItemSeparator className="col-span-2" />
        <div className="grid grid-cols-[1fr_auto] items-center">
            <p className="text-xl font-bold whitespace-nowrap px-2">Balans</p>
            <span className="text-xl font-bold text-right whitespace-nowrap px-2">
                <Spinner />
            </span>
        </div>
        <div className="grid grid-cols-[1fr_auto] items-center">
            <p className="whitespace-nowrap px-2">Streefwaarde</p>
            <span className="font-semibold text-right whitespace-nowrap px-2">
                <Spinner />
            </span>
        </div>
        <ItemSeparator className="col-span-2" />{" "}
        <div className="grid grid-cols-[1fr_auto] items-center">
            <p className="text-xl font-bold whitespace-nowrap px-2 invisible">
                Opgave
            </p>
            <span
                className={
                    "text-xl font-bold text-right whitespace-nowrap px-2"
                }
            >
                <Spinner />
            </span>
        </div>
    </div>
)

const NutrientAdviceSkeleton = () => (
    <div className="flex flex-col space-y-2">
        <div className="grid grid-cols-[1fr_auto] items-center">
            <p className="whitespace-nowrap px-2">Stikstof</p>
            <span className="text-right  px-2">
                {<Spinner className="h-3" />} kg N
            </span>
        </div>
        <Skeleton className="h-2 w-full" />
        <div className="grid grid-cols-[1fr_auto] items-center">
            <p className="whitespace-nowrap px-2">Fosfaat</p>
            <span className="text-right px-2">
                {<Spinner className="h-4" />} kg P₂O₅
            </span>
        </div>
        <Skeleton className="h-2 w-full" />

        <div className="grid grid-cols-[1fr_auto] items-center">
            <p className="whitespace-nowrap px-2">Kalium</p>
            <span className="text-right px-2">
                {<Spinner className="h-4" />}
                kg K₂O
            </span>
        </div>
        <Skeleton className="h-2 w-full" />
    </div>
)
