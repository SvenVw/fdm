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

interface FertilizerApplicationMetricsCardProps {
    norms: {
        manure: GebruiksnormResult
        phosphate: GebruiksnormResult
        nitrogen: GebruiksnormResult
    }
    normsFilling: {
        manure: NormFilling
        phosphate: NormFilling
        nitrogen: NormFilling
    }
    nitrogenBalance: Promise<NitrogenBalanceNumeric> | undefined
    nutrientAdvice: NutrientAdvice
    dose: Dose
    errorMessage: string | undefined
}

const MetricsSkeleton = () => (
    <div className="flex flex-col space-y-2">
        <div className="grid grid-cols-[1fr_auto] items-center">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-16" />
        </div>
        <Skeleton className="h-2 w-full" />
        <div className="grid grid-cols-[1fr_auto] items-center">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-16" />
        </div>
        <Skeleton className="h-2 w-full" />
        <div className="grid grid-cols-[1fr_auto] items-center">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-16" />
        </div>
        <Skeleton className="h-2 w-full" />
        <div className="flex justify-center pt-2">
            <Spinner />
        </div>
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

export function FertilizerApplicationMetricsCard(
    asyncData: FertilizerApplicationMetricsCardProps,
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

    const dose = asyncData.dose

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
                    {/* <ItemGroup>
                        <ItemSeparator />
                        <Item>
                            <ItemContent>
                                <ItemTitle className="hover:underline">
                                    <NavLink to="#">Gebruiksnormen</NavLink>
                                </ItemTitle>
                            </ItemContent>
                            <ItemDescription>
                                <div className="flex flex-col space-y-2">
                                    <div className="grid grid-cols-[1fr_auto] items-center">
                                        <p className="whitespace-nowrap px-2">
                                            Stikstof
                                        </p>
                                        <span className="text-right whitespace-nowrap px-2">
                                            {normsFilling.nitrogen.normFilling?.toFixed(
                                                0,
                                            )}{" "}
                                            /{" "}
                                            {norms.nitrogen.normValue.toFixed(
                                                0,
                                            )}{" "}
                                            kg N
                                        </span>
                                    </div>
                                    <Progress
                                        value={
                                            (normsFilling.nitrogen.normFilling /
                                                norms.nitrogen.normValue) *
                                            100
                                        }
                                        colorBar={getNormsProgressColor(
                                            normsFilling.nitrogen.normFilling,
                                            norms.nitrogen.normValue,
                                        )}
                                        className="h-2"
                                    />

                                    <div className="grid grid-cols-[1fr_auto] items-center">
                                        <p className="whitespace-nowrap px-2">
                                            Fosfaat
                                        </p>
                                        <span className="text-right whitespace-nowrap px-2">
                                            {normsFilling.phosphate.normFilling?.toFixed(
                                                0,
                                            )}{" "}
                                            /{" "}
                                            {norms.phosphate.normValue.toFixed(
                                                0,
                                            )}{" "}
                                            kg P₂O₅
                                        </span>
                                    </div>
                                    <Progress
                                        value={
                                            (normsFilling.phosphate
                                                .normFilling /
                                                norms.phosphate.normValue) *
                                            100
                                        }
                                        colorBar={getNormsProgressColor(
                                            normsFilling.phosphate.normFilling,
                                            norms.phosphate.normValue,
                                        )}
                                        className="h-2"
                                    />

                                    <div className="grid grid-cols-[1fr_auto] items-center">
                                        <p className="whitespace-nowrap px-2">
                                            Dierlijke mest
                                        </p>
                                        <span className="text-right whitespace-nowrap px-2">
                                            {normsFilling.manure.normFilling?.toFixed(
                                                0,
                                            )}{" "}
                                            /{" "}
                                            {norms.manure.normValue.toFixed(0)}{" "}
                                            kg N
                                        </span>
                                    </div>
                                    <Progress
                                        value={
                                            (normsFilling.manure.normFilling /
                                                norms.manure.normValue) *
                                            100
                                        }
                                        colorBar={getNormsProgressColor(
                                            normsFilling.manure.normFilling,
                                            norms.manure.normValue,
                                        )}
                                        className="h-2"
                                    />
                                </div>
                            </ItemDescription>
                        </Item>
                    </ItemGroup> */}
                    <ItemGroup>
                        <ItemSeparator />
                        <Item>
                            <ItemContent>
                                <ItemTitle className="hover:underline">
                                    <NavLink to="#">Stikstofbalans</NavLink>
                                </ItemTitle>
                            </ItemContent>
                            <ItemDescription>
                                <Suspense
                                    fallback={<NitrogenBalanceSkeleton />}
                                >
                                    <Await resolve={asyncData.nitrogenBalance}>
                                        {(nitrogenBalance) => {
                                            const task =
                                                nitrogenBalance.balance.target -
                                                nitrogenBalance.balance.balance
                                            return (
                                                <div className="flex flex-col space-y-2">
                                                    {/* Simplified Flow (Top Section) */}
                                                    <div className="grid grid-cols-[1fr_auto] items-center">
                                                        <p className="whitespace-nowrap px-2">
                                                            Aanvoer
                                                        </p>
                                                        <span className="font-semibold text-right whitespace-nowrap px-2">
                                                            {nitrogenBalance.balance.supply.total.toFixed(
                                                                0,
                                                            )}{" "}
                                                            kg N
                                                        </span>
                                                    </div>
                                                    <div className="grid grid-cols-[1fr_auto] items-center">
                                                        <p className="whitespace-nowrap px-2">
                                                            Afvoer
                                                        </p>
                                                        <span className="font-semibold text-right whitespace-nowrap px-2">
                                                            {nitrogenBalance.balance.removal.total.toFixed(
                                                                0,
                                                            )}{" "}
                                                            kg N
                                                        </span>
                                                    </div>
                                                    <div className="grid grid-cols-[1fr_auto] items-center">
                                                        <p className="whitespace-nowrap px-2">
                                                            Emissie
                                                        </p>
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
                                                        <p className="text-xl font-bold whitespace-nowrap px-2">
                                                            {nitrogenBalance
                                                                .balance.task <
                                                            0
                                                                ? "Opgave"
                                                                : "Ruimte"}
                                                        </p>
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
                                    <NavLink to="#">Bemestingsadvies</NavLink>
                                </ItemTitle>
                            </ItemContent>
                            <ItemDescription>
                                <Suspense fallback={<NutrientAdviceSkeleton />}>
                                    <Await resolve={asyncData.nutrientAdvice}>
                                        {(nutrientAdvice) => (
                                            <div className="flex flex-col space-y-2">
                                                <div className="grid grid-cols-[1fr_auto] items-center">
                                                    <p className="whitespace-nowrap px-2">
                                                        Stikstof
                                                    </p>
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
