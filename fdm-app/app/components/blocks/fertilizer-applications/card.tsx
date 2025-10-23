import type { Dose } from "@svenvw/fdm-calculator"
import type { ApplicationMethods } from "@svenvw/fdm-data"
import { format } from "date-fns"
import { Lightbulb, Scale } from "lucide-react"
import { useEffect, useRef, useState } from "react"
import { useFetcher, useLocation, useNavigation, useParams } from "react-router"
import { useFieldFertilizerFormStore } from "@/app/store/field-fertilizer-form"
import { LoadingSpinner } from "~/components/custom/loadingspinner"
import { Button } from "~/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "~/components/ui/dialog"
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "~/components/ui/tooltip"
import { cn } from "~/lib/utils"
import { FertilizerApplicationForm } from "./form"
import type {
    FertilizerApplication,
    FertilizerApplicationsCardProps,
    FertilizerOption,
} from "./types.d"
import { FertilizerApplicationsList } from "./list"

function FertilizerApplicationsDetailCard({
    title,
    shortname,
    value,
    unit,
    limit,
    advice,
}: FertilizerApplicationsCardProps) {
    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{title}</CardTitle>
                <p className="text-xs text-muted-foreground">{shortname}</p>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex items-baseline space-x-2">
                    <div className="text-2xl font-bold">{`${Math.round(value)}`}</div>
                    <div className="text-sm text-muted-foreground">{unit}</div>
                </div>
                <div className="grid grid-cols-2 items-center space-x-2">
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <div
                                    className={cn(
                                        "flex items-center space-x-2 text-muted-foreground justify-start",
                                        !limit ? "invisible" : "",
                                    )}
                                >
                                    <Scale className="h-8 w-4" />
                                    <p className="flex text-xs text-muted-foreground">
                                        <span>{`${limit}`}</span>
                                    </p>
                                </div>
                            </TooltipTrigger>
                            <TooltipContent>
                                {`Gebruiksnorm voor ${title} [${unit}]`}
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <div
                                    className={cn(
                                        "flex items-center space-x-2 text-muted-foreground justify-end",
                                        !advice ? "invisible" : "",
                                    )}
                                >
                                    <Lightbulb className="h-4 w-4" />
                                    <p className="flex text-xs text-muted-foreground">
                                        <span>{`${advice}`}</span>
                                    </p>
                                </div>
                            </TooltipTrigger>
                            <TooltipContent>
                                {`Bemestingsadvies voor ${title} [${unit}]`}
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                </div>
            </CardContent>
        </Card>
    )
}

function constructCards(dose: Dose) {
    // Construct the fertilizer application cards
    const cards: FertilizerApplicationsCardProps[] = [
        {
            title: "Stikstof, totaal",
            shortname: "Ntot",
            value: dose.p_dose_n,
            unit: "kg/ha",
            limit: undefined,
            advice: undefined,
        },
        {
            title: "Stikstof, werkzaam",
            shortname: "Nw",
            value: dose.p_dose_nw,
            unit: "kg/ha",
            limit: undefined,
            advice: undefined,
        },
        {
            title: "Fosfaat, totaal",
            shortname: "P2O5",
            value: dose.p_dose_p,
            unit: "kg/ha",
            limit: undefined,
            advice: undefined,
        },
        {
            title: "Kalium, totaal",
            shortname: "K2O",
            value: dose.p_dose_k,
            unit: "kg/ha",
            limit: undefined,
            advice: undefined,
        },
    ]

    return cards
}

export function FertilizerApplicationCard({
    fertilizerApplications,
    applicationMethodOptions,
    fertilizers,
    fertilizerOptions,
    dose,
    className,
}: {
    fertilizerApplications: FertilizerApplication[]
    applicationMethodOptions: {
        value: ApplicationMethods
        label: string
    }[]
    fertilizers: Fertilizer[]
    fertilizerOptions: FertilizerOption[]
    dose: Dose
    className?: string
}) {
    const fetcher = useFetcher()
    const location = useLocation()
    const params = useParams()
    const navigation = useNavigation()
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const previousNavigationState = useRef(navigation.state)

    const b_id_or_b_lu_catalogue = params.b_lu_catalogue || params.b_id

    const handleDelete = (p_app_id: string | string[]) => {
        if (fetcher.state === "submitting") return

        fetcher.submit({ p_app_id }, { method: "DELETE" })
    }

    useEffect(() => {
        const wasNotIdle = previousNavigationState.current !== "idle"
        const isIdle = navigation.state === "idle"

        if (wasNotIdle && isIdle) {
            setIsDialogOpen(false)
        }

        previousNavigationState.current = navigation.state
    }, [navigation.state])

    const fieldFertilizerFormStore = useFieldFertilizerFormStore()
    const savedFormValues =
        params.b_id_farm &&
        b_id_or_b_lu_catalogue &&
        fieldFertilizerFormStore.load(params.b_id_farm, b_id_or_b_lu_catalogue)
    useEffect(() => {
        if (!isDialogOpen && savedFormValues) {
            setIsDialogOpen(true)
        }
    }, [isDialogOpen, savedFormValues])

    const detailCards = constructCards(dose)

    function handleDialogOpenChange(state: boolean) {
        if (!state && params.b_id_farm && b_id_or_b_lu_catalogue) {
            fieldFertilizerFormStore.delete(
                params.b_id_farm,
                b_id_or_b_lu_catalogue,
            )
        }

        setIsDialogOpen(state)
    }

    return (
        <Card
            className={cn(
                "col-span-2 space-y-4 transition-transform duration-200 hover:scale-[1.02]",
                className,
            )}
        >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle>
                    <p className="text-lg font-medium">Bemesting</p>
                    <p className="text-sm font-medium text-muted-foreground">
                        Voeg bemestingen toe, verwijder ze en bekijk de totale
                        gift per hectare voor verschillende nutriënten
                    </p>
                </CardTitle>
                <Dialog
                    open={isDialogOpen}
                    onOpenChange={handleDialogOpenChange}
                >
                    <DialogTrigger asChild>
                        <Button>Bemesting toevoegen</Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[800px]">
                        <DialogHeader>
                            <DialogTitle className="flex flex-row items-center justify-between mr-4">
                                Bemesting toevoegen
                            </DialogTitle>
                            <DialogDescription>
                                Voeg een nieuwe bemestingstoepassing toe aan het
                                perceel.
                            </DialogDescription>
                        </DialogHeader>
                        <FertilizerApplicationForm
                            options={fertilizerOptions}
                            action={location.pathname}
                            navigation={navigation}
                            b_id_farm={params.b_id_farm || ""}
                            b_id_or_b_lu_catalogue={
                                b_id_or_b_lu_catalogue || ""
                            }
                        />
                    </DialogContent>
                </Dialog>
            </CardHeader>
            <CardContent>
                <FertilizerApplicationsList
                    fertilizerApplications={fertilizerApplications}
                    applicationMethodOptions={applicationMethodOptions}
                    fertilizers={fertilizers}
                    handleDelete={handleDelete}
                />
            </CardContent>
        </Card>
    )
}
