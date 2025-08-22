import { ReactNode } from "react"
import { useLocation, useMatches, useParams } from "react-router"
import { useCalendarStore } from "@/app/store/calendar"
import { useFarmFieldOptionsStore } from "@/app/store/farm-field-options"
import { HeaderAtlas } from "./atlas"
import { HeaderBalance } from "./balance"
import { Header } from "./base"
import { HeaderFarmCreate } from "./create-farm"
import { HeaderFarm, type HeaderFarmOption } from "./farm"
import { HeaderFertilizer } from "./fertilizer"
import { HeaderField, type HeaderFieldOption } from "./field"
import { HeaderNorms } from "./norms"
import { HeaderNutrientAdvice } from "./nutrient-advice"

export default function HeaderAutomatic() {
    const matches = useMatches()
    const params = useParams()
    const location = useLocation()
    const farmFieldOptionsStore = useFarmFieldOptionsStore()
    const storedCalendar = useCalendarStore((s) => s.calendar)

    // Find the farm and field options.
    let farmOptions: HeaderFarmOption[] | undefined
    let fieldOptions: HeaderFieldOption[] | undefined
    let fertilizerOptions: unknown[] | undefined
    let b_name_farm: string | undefined

    for (const match of matches) {
        if (match.loaderData) {
            farmOptions ??= (
                match.loaderData as { farmOptions?: HeaderFarmOption[] }
            ).farmOptions
            fieldOptions ??= (
                match.loaderData as { fieldOptions?: HeaderFieldOption[] }
            ).fieldOptions
            fertilizerOptions ??= (
                match.loaderData as { fertilizerOptions?: unknown[] }
            ).fertilizerOptions
        }
    }

    farmOptions ??= farmFieldOptionsStore.farmOptions
    fieldOptions ??= farmFieldOptionsStore.fieldOptions
    b_name_farm ??= farmFieldOptionsStore.getFarmById(
        params.b_id_farm,
    )?.b_name_farm
    const calendar = params.calendar ?? storedCalendar

    if (/create/.test(location.pathname)) {
        return (
            <Header action={undefined}>
                <HeaderFarmCreate b_name_farm={b_name_farm} />
            </Header>
        )
    }

    const variants: Record<string, () => ReactNode> = {
        "routes/farm._index": () => (
            <Header action={undefined}>
                <HeaderFarm b_id_farm={undefined} farmOptions={farmOptions} />
            </Header>
        ),
        "routes/farm.$b_id_farm.settings.properties": () => (
            <Header
                action={{
                    to: `/farm/${params.b_id_farm}/${calendar}/field`,
                    label: "Naar percelen",
                    disabled: false,
                }}
            >
                <HeaderFarm
                    b_id_farm={params.b_id_farm}
                    farmOptions={farmOptions}
                />
            </Header>
        ),
        "routes/farm.$b_id_farm.$calendar.field.new": () =>
            variants["routes/farm.$b_id_farm.$calendar.field._index"](),
        "routes/farm.$b_id_farm.$calendar.field.$b_id": () =>
            variants["routes/farm.$b_id_farm.$calendar.field._index"](),
        "routes/farm.$b_id_farm.$calendar.field._index": () => (
            <Header
                action={{
                    to: `/farm/${params.b_id_farm}`,
                    label: "Terug naar bedrijf",
                    disabled: false,
                }}
            >
                <HeaderFarm
                    b_id_farm={params.b_id_farm}
                    farmOptions={farmOptions}
                />
                <HeaderField
                    b_id_farm={params.b_id_farm}
                    fieldOptions={
                        /new\/?$/.test(location.pathname) ? [] : fieldOptions
                    }
                    b_id={params.b_id}
                />
            </Header>
        ),
        "routes/farm.$b_id_farm.fertilizers.$p_id": () =>
            variants["routes/farm.$b_id_farm.fertilizers._index"](),
        "routes/farm.$b_id_farm.fertilizers._index": () => (
            <Header action={undefined}>
                <HeaderFarm
                    b_id_farm={params.b_id_farm}
                    farmOptions={farmOptions}
                />
                <HeaderFertilizer
                    b_id_farm={params.b_id_farm}
                    p_id={params.p_id}
                    fertilizerOptions={fertilizerOptions}
                />
            </Header>
        ),
        "routes/farm.$b_id_farm.$calendar.atlas": () => {
            const isFieldDetailsPage =
                location.pathname.includes("/atlas/fields/") &&
                location.pathname.split("/atlas/fields/")[1]?.includes(",")
            let headerAction:
                | { to: string; label: string; disabled: boolean }
                | undefined
            if (isFieldDetailsPage) {
                headerAction = {
                    to: `/farm/${params.b_id_farm}/${calendar}/atlas/fields`,
                    label: "Terug",
                    disabled: false,
                }
            }
            return (
                <Header action={headerAction}>
                    <HeaderFarm
                        b_id_farm={params.b_id_farm}
                        farmOptions={farmOptions}
                    />
                    <HeaderAtlas b_id_farm={params.b_id_farm} />
                </Header>
            )
        },
        "routes/farm.$b_id_farm.$calendar.balance.nitrogen": () => (
            <Header action={undefined}>
                <HeaderFarm
                    b_id_farm={params.b_id_farm}
                    farmOptions={farmOptions}
                />
                <HeaderBalance
                    b_id_farm={params.b_id_farm}
                    b_id={params.b_id}
                    fieldOptions={fieldOptions}
                />
            </Header>
        ),
        "routes/farm.$b_id_farm.$calendar.nutrient_advice": () => (
            <Header action={undefined}>
                <HeaderFarm
                    b_id_farm={params.b_id_farm}
                    farmOptions={farmOptions}
                />
                <HeaderNutrientAdvice
                    b_id_farm={params.b_id_farm}
                    b_id={params.b_id}
                    fieldOptions={fieldOptions}
                />
            </Header>
        ),
        "routes/farm.$b_id_farm.$calendar.norms": () => (
            <Header action={undefined}>
                <HeaderFarm
                    b_id_farm={params.b_id_farm}
                    farmOptions={farmOptions}
                />
                <HeaderNorms b_id_farm={params.b_id_farm} />
            </Header>
        ),
    }

    let chosenVariant: (() => ReactNode) | undefined

    for (const match of matches) {
        if (match.id in variants) {
            chosenVariant = variants[match.id]
            break
        }
    }

    return chosenVariant ? chosenVariant() : null
}
