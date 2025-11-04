import type {
    Dose,
    GebruiksnormResult,
    NitrogenBalanceNumeric,
    NormFilling,
    NutrientAdvice,
} from "@svenvw/fdm-calculator"
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
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "~/components/ui/tooltip"

interface FertilizerApplicationMetricsData {
    norms: Promise<{
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
    }>
    nitrogenBalance: Promise<NitrogenBalanceNumeric> | undefined
    nutrientAdvice: NutrientAdvice
    dose: Dose
    b_id: string
    b_id_farm: string
    calendar: string
}

interface FertilizerApplicationMetricsCardProps {
    fertilizerApplicationMetricsData: FertilizerApplicationMetricsData
    isSubmitting: boolean
}

export function FertilizerApplicationMetricsCard({
    fertilizerApplicationMetricsData,
    isSubmitting,
}: FertilizerApplicationMetricsCardProps) {
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

    const {
        norms,
        nitrogenBalance,
        nutrientAdvice,
        dose,
        b_id,
        b_id_farm,
        calendar,
    } = fertilizerApplicationMetricsData

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    Bemestingsdashboard
                </CardTitle>
                <CardDescription>
                    Krijg inzicht in de effecten van de bemesting.
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
                                        to={`/farm/${b_id_farm}/${calendar}/norms/${b_id}`}
                                    >
                                        Gebruiksnormen
                                    </NavLink>
                                </ItemTitle>
                            </ItemContent>
                            <ItemDescription>
                                {isSubmitting ? (
                                    <NormsSkeleton />
                                ) : (
                                    <Suspense fallback={<NormsSkeleton />}>
                                        <Await
                                            errorElement={
                                                <div>
                                                    Helaas, er is wat misgegaan
                                                    met de berekening
                                                </div>
                                            }
                                            resolve={norms}
                                        >
                                            {(resolvedNorms) => (
                                                <div className="flex flex-col space-y-2">
                                                    <div className="grid grid-cols-[1fr_auto] items-center">
                                                        <Tooltip>
                                                            <TooltipTrigger
                                                                asChild
                                                            >
                                                                <p className="whitespace-nowrap px-2">
                                                                    Stikstof
                                                                </p>
                                                            </TooltipTrigger>
                                                            <TooltipContent>
                                                                <p>
                                                                    Werkzame
                                                                    stikstof
                                                                    volgens
                                                                    forfaitaire
                                                                    gehalten
                                                                </p>
                                                            </TooltipContent>
                                                        </Tooltip>
                                                        <span className="text-right whitespace-nowrap px-2">
                                                            {Math.round(
                                                                resolvedNorms
                                                                    .filling
                                                                    .nitrogen,
                                                            )}{" "}
                                                            /{" "}
                                                            {Math.round(
                                                                resolvedNorms
                                                                    .value
                                                                    .nitrogen,
                                                            )}{" "}
                                                            kg N
                                                        </span>
                                                    </div>
                                                    <Progress
                                                        value={
                                                            (resolvedNorms
                                                                .filling
                                                                .nitrogen /
                                                                resolvedNorms
                                                                    .value
                                                                    .nitrogen) *
                                                            100
                                                        }
                                                        colorBar={getNormsProgressColor(
                                                            resolvedNorms
                                                                .filling
                                                                .nitrogen,
                                                            resolvedNorms.value
                                                                .nitrogen,
                                                        )}
                                                        className="h-2"
                                                    />

                                                    <div className="grid grid-cols-[1fr_auto] items-center">
                                                        <Tooltip>
                                                            <TooltipTrigger
                                                                asChild
                                                            >
                                                                <p className="whitespace-nowrap px-2">
                                                                    Fosfaat
                                                                </p>
                                                            </TooltipTrigger>
                                                            <TooltipContent>
                                                                <p>
                                                                    Fosfaataanvoer
                                                                    incl.
                                                                    mogelijke
                                                                    stimuleringsregeling
                                                                </p>
                                                            </TooltipContent>
                                                        </Tooltip>
                                                        <span className="text-right whitespace-nowrap px-2">
                                                            {Math.round(
                                                                resolvedNorms
                                                                    .filling
                                                                    .phosphate,
                                                            )}{" "}
                                                            /{" "}
                                                            {Math.round(
                                                                resolvedNorms
                                                                    .value
                                                                    .phosphate,
                                                            )}{" "}
                                                            kg P₂O₅
                                                        </span>
                                                    </div>
                                                    <Progress
                                                        value={
                                                            (resolvedNorms
                                                                .filling
                                                                .phosphate /
                                                                resolvedNorms
                                                                    .value
                                                                    .phosphate) *
                                                            100
                                                        }
                                                        colorBar={getNormsProgressColor(
                                                            resolvedNorms
                                                                .filling
                                                                .phosphate,
                                                            resolvedNorms.value
                                                                .phosphate,
                                                        )}
                                                        className="h-2"
                                                    />

                                                    <div className="grid grid-cols-[1fr_auto] items-center">
                                                        <Tooltip>
                                                            <TooltipTrigger
                                                                asChild
                                                            >
                                                                <p className="whitespace-nowrap px-2">
                                                                    Dierlijke
                                                                    mest
                                                                </p>
                                                            </TooltipTrigger>
                                                            <TooltipContent>
                                                                <p>
                                                                    Totaal
                                                                    stikstof via
                                                                    dierlijke
                                                                    mest
                                                                </p>
                                                            </TooltipContent>
                                                        </Tooltip>
                                                        <span className="text-right whitespace-nowrap px-2">
                                                            {Math.round(
                                                                resolvedNorms
                                                                    .filling
                                                                    .manure,
                                                            )}{" "}
                                                            /{" "}
                                                            {Math.round(
                                                                resolvedNorms
                                                                    .value
                                                                    .manure,
                                                            )}{" "}
                                                            kg N
                                                        </span>
                                                    </div>
                                                    <Progress
                                                        value={
                                                            (resolvedNorms
                                                                .filling
                                                                .manure /
                                                                resolvedNorms
                                                                    .value
                                                                    .manure) *
                                                            100
                                                        }
                                                        colorBar={getNormsProgressColor(
                                                            resolvedNorms
                                                                .filling.manure,
                                                            resolvedNorms.value
                                                                .manure,
                                                        )}
                                                        className="h-2"
                                                    />
                                                </div>
                                            )}
                                        </Await>
                                    </Suspense>
                                )}
                            </ItemDescription>
                        </Item>
                    </ItemGroup>
                    <ItemGroup>
                        <ItemSeparator />
                        <Item>
                            <ItemContent>
                                <ItemTitle className="hover:underline">
                                    <NavLink
                                        to={`/farm/${b_id_farm}/${calendar}/balance/nitrogen/${b_id}`}
                                    >
                                        Stikstofbalans
                                    </NavLink>
                                </ItemTitle>
                            </ItemContent>
                            <ItemDescription>
                                {isSubmitting ? (
                                    <NitrogenBalanceSkeleton />
                                ) : (
                                    <Suspense
                                        fallback={<NitrogenBalanceSkeleton />}
                                    >
                                        <Await
                                            errorElement={
                                                <div>
                                                    Helaas, er is wat misgegaan
                                                    met de berekening
                                                </div>
                                            }
                                            resolve={nitrogenBalance}
                                        >
                                            {(resolvedNitrogenBalance) => {
                                                const task =
                                                    resolvedNitrogenBalance
                                                        .balance.target -
                                                    resolvedNitrogenBalance
                                                        .balance.balance
                                                return (
                                                    <div className="flex flex-col space-y-1">
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
                                                                        stikstof
                                                                        via
                                                                        bemesting,
                                                                        depositie,
                                                                        mineralisatie
                                                                        en
                                                                        fixatie
                                                                    </p>
                                                                </TooltipContent>
                                                            </Tooltip>

                                                            <span className="font-semibold text-right whitespace-nowrap px-2">
                                                                {Math.round(
                                                                    resolvedNitrogenBalance
                                                                        .balance
                                                                        .supply
                                                                        .total,
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
                                                                        stikstof
                                                                        via
                                                                        oogst en
                                                                        gewasresten
                                                                    </p>
                                                                </TooltipContent>
                                                            </Tooltip>
                                                            <span className="font-semibold text-right whitespace-nowrap px-2">
                                                                {Math.round(
                                                                    resolvedNitrogenBalance
                                                                        .balance
                                                                        .removal
                                                                        .total,
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
                                                                        stikstof
                                                                        via
                                                                        gasvormige
                                                                        verliezen
                                                                        (NH3)
                                                                    </p>
                                                                </TooltipContent>
                                                            </Tooltip>
                                                            <span className="font-semibold text-right whitespace-nowrap px-2">
                                                                {Math.round(
                                                                    resolvedNitrogenBalance
                                                                        .balance
                                                                        .emission
                                                                        .total,
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
                                                                {Math.round(
                                                                    resolvedNitrogenBalance
                                                                        .balance
                                                                        .balance,
                                                                )}{" "}
                                                                kg N
                                                            </span>
                                                        </div>
                                                        <div className="grid grid-cols-[1fr_auto] items-center">
                                                            <p className="whitespace-nowrap px-2">
                                                                Streefwaarde
                                                            </p>
                                                            <span className="font-semibold text-right whitespace-nowrap px-2">
                                                                {Math.round(
                                                                    resolvedNitrogenBalance
                                                                        .balance
                                                                        .target,
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
                                                                        {task <
                                                                        0
                                                                            ? "Opgave"
                                                                            : "Ruimte"}
                                                                    </p>
                                                                </TooltipTrigger>
                                                                <TooltipContent>
                                                                    <p>
                                                                        {task <
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
                                                                {Math.round(
                                                                    task,
                                                                )}{" "}
                                                                kg N
                                                            </span>
                                                        </div>
                                                    </div>
                                                )
                                            }}
                                        </Await>
                                    </Suspense>
                                )}
                            </ItemDescription>
                        </Item>
                    </ItemGroup>
                    <ItemGroup>
                        <ItemSeparator />
                        <Item>
                            <ItemContent>
                                <ItemTitle className="hover:underline">
                                    <NavLink
                                        to={`/farm/${b_id_farm}/${calendar}/nutrient_advice/${b_id}`}
                                    >
                                        Bemestingsadvies
                                    </NavLink>
                                </ItemTitle>
                            </ItemContent>
                            <ItemDescription>
                                {isSubmitting ? (
                                    <NutrientAdviceSkeleton />
                                ) : (
                                    <Suspense
                                        fallback={<NutrientAdviceSkeleton />}
                                    >
                                        <Await
                                            errorElement={
                                                <div>
                                                    Helaas, er is wat misgegaan
                                                    met de berekening
                                                </div>
                                            }
                                            resolve={nutrientAdvice}
                                        >
                                            {(resolvedNutrientAdvice) => (
                                                <div className="flex flex-col space-y-2">
                                                    <div className="grid grid-cols-[1fr_auto] items-center">
                                                        <Tooltip>
                                                            <TooltipTrigger
                                                                asChild
                                                            >
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
                                                            {Math.round(
                                                                dose.p_dose_n,
                                                            )}{" "}
                                                            /{" "}
                                                            {Math.round(
                                                                resolvedNutrientAdvice.d_n_req,
                                                            )}{" "}
                                                            kg N
                                                        </span>
                                                    </div>
                                                    <Progress
                                                        key={`n-${dose.p_dose_n}`}
                                                        value={
                                                            (dose.p_dose_n /
                                                                resolvedNutrientAdvice.d_n_req) *
                                                            100
                                                        }
                                                        colorBar={getAdviceProgressColor(
                                                            dose.p_dose_n,
                                                            resolvedNutrientAdvice.d_n_req,
                                                        )}
                                                        className="h-2"
                                                    />

                                                    <div className="grid grid-cols-[1fr_auto] items-center">
                                                        <p className="whitespace-nowrap px-2">
                                                            Fosfaat
                                                        </p>
                                                        <span className="text-right whitespace-nowrap px-2">
                                                            {Math.round(
                                                                dose.p_dose_p,
                                                            )}{" "}
                                                            /{" "}
                                                            {Math.round(
                                                                resolvedNutrientAdvice.d_p_req,
                                                            )}{" "}
                                                            kg P₂O₅
                                                        </span>
                                                    </div>
                                                    <Progress
                                                        key={`p-${dose.p_dose_p}`}
                                                        value={
                                                            (dose.p_dose_p /
                                                                resolvedNutrientAdvice.d_p_req) *
                                                            100
                                                        }
                                                        colorBar={getAdviceProgressColor(
                                                            dose.p_dose_p,
                                                            resolvedNutrientAdvice.d_p_req,
                                                        )}
                                                        className="h-2"
                                                    />

                                                    <div className="grid grid-cols-[1fr_auto] items-center">
                                                        <p className="whitespace-nowrap px-2">
                                                            Kalium
                                                        </p>
                                                        <span className="text-right whitespace-nowrap px-2">
                                                            {Math.round(
                                                                dose.p_dose_k,
                                                            )}{" "}
                                                            /{" "}
                                                            {Math.round(
                                                                resolvedNutrientAdvice.d_k_req,
                                                            )}{" "}
                                                            kg K₂O
                                                        </span>
                                                    </div>
                                                    <Progress
                                                        key={`k-${dose.p_dose_k}`}
                                                        value={
                                                            (dose.p_dose_k /
                                                                resolvedNutrientAdvice.d_k_req) *
                                                            100
                                                        }
                                                        colorBar={getAdviceProgressColor(
                                                            dose.p_dose_k,
                                                            resolvedNutrientAdvice.d_k_req,
                                                        )}
                                                        className="h-2"
                                                    />
                                                </div>
                                            )}
                                        </Await>
                                    </Suspense>
                                )}
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
            <span className="text-right px-2">
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
