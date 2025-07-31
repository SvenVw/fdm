import type { Dose } from "@svenvw/fdm-calculator"
import type { ApplicationMethods } from "@svenvw/fdm-data"
import { format } from "date-fns"
import { Lightbulb, Scale } from "lucide-react"
import { useEffect, useState } from "react"
import { useFetcher, useLocation, useNavigation } from "react-router"
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
import { LoadingSpinner } from "../../custom/loadingspinner"
import { FertilizerApplicationForm } from "./form"
import type {
    FertilizerApplication,
    FertilizerApplicationsCardProps,
    FertilizerOption,
} from "./types.d"

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
    fertilizerOptions,
    dose,
}: {
    fertilizerApplications: FertilizerApplication[]
    applicationMethodOptions: {
        value: ApplicationMethods
        label: string
    }[]
    fertilizerOptions: FertilizerOption[]
    dose: Dose
}) {
    const fetcher = useFetcher()
    const location = useLocation()
    const navigation = useNavigation()
    const [isDialogOpen, setIsDialogOpen] = useState(false)

    const handleDelete = (p_app_id: string | string[]) => {
        if (fetcher.state === "submitting") return

        fetcher.submit({ p_app_id }, { method: "DELETE" })
    }

    useEffect(() => {
        if (navigation.state === "idle" && fetcher.state === "idle") {
            setIsDialogOpen(false)
        }
    }, [navigation.state, fetcher.state])

    const detailCards = constructCards(dose)

    return (
        <Card className="col-span-2 space-y-4">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle>
                    <p className="text-lg font-medium">Bemesting</p>
                    <p className="text-sm font-medium text-muted-foreground">
                        Voeg bemestingen toe, verwijder ze en bekijk de totale
                        gift per hectare voor verschillende nutriënten
                    </p>
                </CardTitle>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                        <Button>Bemesting toevoegen</Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[800px]">
                        <DialogHeader>
                            <DialogTitle>Bemesting toevoegen</DialogTitle>
                            <DialogDescription>
                                Voeg een nieuwe bemestingstoepassing toe aan het
                                perceel.
                            </DialogDescription>
                        </DialogHeader>
                        <FertilizerApplicationForm
                            options={fertilizerOptions}
                            action={location.pathname}
                            onSuccess={() => setIsDialogOpen(false)}
                            navigation={navigation}
                        />
                    </DialogContent>
                </Dialog>
            </CardHeader>
            <CardContent className="grid 2xl:grid-cols-3 gap-8">
                <div className="space-y-4 2xl:col-span-2 items-start">
                    {fertilizerApplications.length > 0 ? (
                        fertilizerApplications.map((application) => (
                            <div
                                className="grid grid-cols-5 gap-x-3 items-center"
                                key={application.p_app_id}
                            >
                                <div className="col-span-2">
                                    <p className="text-sm font-medium leading-none">
                                        {application.p_name_nl}
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                        {application.p_app_method
                                            ? applicationMethodOptions.find(
                                                  (x) =>
                                                      x.value ===
                                                      application.p_app_method,
                                              )?.label
                                            : "Toedieningsmethode niet bekend"}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground leading-none">
                                        {application.p_app_amount} kg / ha
                                    </p>
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground leading-none">
                                        {format(
                                            application.p_app_date,
                                            "yyyy-MM-dd",
                                        )}
                                    </p>
                                </div>
                                <div className="justify-self-end">
                                    <Button
                                        variant="destructive"
                                        disabled={
                                            fetcher.state === "submitting"
                                        }
                                        onClick={() => {
                                            if (application.p_app_ids) {
                                                handleDelete(
                                                    application.p_app_ids,
                                                )
                                            } else {
                                                handleDelete([
                                                    application.p_app_id,
                                                ])
                                            }
                                        }}
                                    >
                                        {fetcher.state === "submitting" ? (
                                            <div className="flex items-center space-x-2">
                                                <LoadingSpinner />
                                                <span>Verwijderen...</span>
                                            </div>
                                        ) : (
                                            "Verwijder"
                                        )}
                                    </Button>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="mx-auto flex h-full w-full items-center flex-col justify-center space-y-6">
                            <div className="flex flex-col space-y-2 text-center">
                                <h1 className="text-2xl font-semibold tracking-tight">
                                    Je hebt nog geen bemesting ingevuld...
                                </h1>
                                <p className="text-sm text-muted-foreground">
                                    Voeg een bemesting toe om gegevens zoals,
                                    meststof, hoeveelheid en datum bij te
                                    houden.
                                </p>
                            </div>
                        </div>
                    )}
                </div>
                <div className="grid gap-4 sm:grid-cols-4 2xl:grid-cols-2">
                    {detailCards.map(
                        (card: FertilizerApplicationsCardProps) => (
                            <FertilizerApplicationsDetailCard
                                key={card.title}
                                title={card.title}
                                shortname={card.shortname}
                                value={card.value}
                                unit={card.unit}
                                limit={card.limit}
                                advice={card.advice}
                            />
                        ),
                    )}
                </div>
            </CardContent>
        </Card>
    )
}
