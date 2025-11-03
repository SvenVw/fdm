import type { Dose } from "@svenvw/fdm-calculator"
import type { ApplicationMethods } from "@svenvw/fdm-data"
import { useEffect, useRef, useState } from "react"
import { useFetcher, useLocation, useNavigation, useParams } from "react-router"
import { useFieldFertilizerFormStore } from "@/app/store/field-fertilizer-form"
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
import { FertilizerApplicationForm } from "./form"
import type { FertilizerApplication, FertilizerOption } from "./types.d"
import { FertilizerApplicationsList } from "./list"
import type { Fertilizer } from "@svenvw/fdm-core"
import { Plus } from "lucide-react"

export function FertilizerApplicationCard({
    fertilizerApplications,
    applicationMethodOptions,
    fertilizers,
    fertilizerOptions,
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
    const [editedFertilizerApplication, setEditedFertilizerApplication] =
        useState<FertilizerApplication>()
    const previousNavigationState = useRef(navigation.state)

    const b_id_or_b_lu_catalogue = params.b_lu_catalogue || params.b_id

    const handleDelete = (p_app_id: string | string[]) => {
        if (fetcher.state === "submitting") return

        fetcher.submit({ p_app_id }, { method: "DELETE" })
    }

    const handleEdit = (fertilizerApplication: FertilizerApplication) => () => {
        setEditedFertilizerApplication(fertilizerApplication)
        setIsDialogOpen(true)
    }

    useEffect(() => {
        const wasNotIdle = previousNavigationState.current !== "idle"
        const isIdle = navigation.state === "idle"

        if (wasNotIdle && isIdle) {
            setIsDialogOpen(false)
            setEditedFertilizerApplication(undefined)
        }

        previousNavigationState.current = navigation.state
    }, [navigation.state])

    const fieldFertilizerFormStore = useFieldFertilizerFormStore()
    const savedFormValues =
        params.b_id_farm && b_id_or_b_lu_catalogue
            ? fieldFertilizerFormStore.load(
                  params.b_id_farm,
                  b_id_or_b_lu_catalogue,
              )
            : null

    // See if the saved form was for updating an existing application.
    // If so, verify that the user can still edit the application and update the state.
    const applicationToEdit = savedFormValues?.p_app_id
        ? fertilizerApplications.find(
              (app) => app.p_app_id === savedFormValues.p_app_id,
          )
        : null
    useEffect(() => {
        if (applicationToEdit && !editedFertilizerApplication) {
            setEditedFertilizerApplication(applicationToEdit)
        }
        if (savedFormValues?.p_app_id && !applicationToEdit) {
            fieldFertilizerFormStore.delete(
                params.b_id_farm || "",
                b_id_or_b_lu_catalogue || "",
            )
        }
    }, [
        applicationToEdit,
        params.b_id_farm,
        b_id_or_b_lu_catalogue,
        savedFormValues,
        editedFertilizerApplication,
        fieldFertilizerFormStore.delete,
    ])

    useEffect(() => {
        if (savedFormValues && !isDialogOpen) {
            if (savedFormValues.p_app_id) {
                // Do not open the form if there is a risk it will create a new application
                if (applicationToEdit) {
                    setIsDialogOpen(true)
                }
            } else {
                setIsDialogOpen(true)
            }
        }
    }, [savedFormValues, applicationToEdit, isDialogOpen])

    function handleDialogOpenChange(state: boolean) {
        if (!state && params.b_id_farm && b_id_or_b_lu_catalogue) {
            fieldFertilizerFormStore.delete(
                params.b_id_farm,
                b_id_or_b_lu_catalogue,
            )
        }

        if (!state) {
            setEditedFertilizerApplication(undefined)
        }

        setIsDialogOpen(state)
    }

    return (
        <Card>
            <CardHeader className="flex flex-col space-y-4 xl:flex-row xl:items-center xl:justify-between xl:space-y-0">
                <CardTitle>
                    <p className="text-lg font-medium">Bemesting</p>
                </CardTitle>
                <Dialog
                    open={isDialogOpen}
                    onOpenChange={handleDialogOpenChange}
                >
                    <DialogTrigger asChild>
                        <Button>
                            <Plus className="size-4" />
                            Toevoegen
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[800px]">
                        <DialogHeader>
                            <DialogTitle className="flex flex-row items-center justify-between mr-4">
                                {editedFertilizerApplication
                                    ? "Bemesting wijzigen"
                                    : "Bemesting toevoegen"}
                            </DialogTitle>
                            <DialogDescription>
                                {editedFertilizerApplication
                                    ? "Wijzig een bemestingtoepassing aan het percel."
                                    : "Voeg een nieuwe bemestingstoepassing toe aan het perceel."}
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
                            fertilizerApplication={editedFertilizerApplication}
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
                    handleEdit={handleEdit}
                />
            </CardContent>
        </Card>
    )
}
