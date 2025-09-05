import type { ReactNode } from "react"
import { type UIMatch, useLocation, useMatches, useParams } from "react-router"
import { useCalendarStore } from "@/app/store/calendar"
import { useFarmFieldOptionsStore } from "@/app/store/farm-field-options"
import type { FertilizerOption } from "../farm/farm"
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
    interface LoaderDataCandidate {
        b_name_farm?: string
        farmOptions?: HeaderFarmOption[]
        fieldOptions?: HeaderFieldOption[]
        fertilizerOptions?: FertilizerOption[]
    }
    const matches = useMatches() as UIMatch<LoaderDataCandidate, unknown>[]
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
            b_name_farm ??= match.loaderData.b_name_farm
            farmOptions ??= match.loaderData.farmOptions
            fieldOptions ??= match.loaderData.fieldOptions
            fertilizerOptions ??= match.loaderData.fertilizerOptions
        }
    }

    farmOptions ??= farmFieldOptionsStore.farmOptions
    fieldOptions ??= farmFieldOptionsStore.fieldOptions
    b_name_farm ??=
        farmFieldOptionsStore.getFarmById(params.b_id_farm)?.b_name_farm ??
        undefined

    const calendar = params.calendar ?? storedCalendar

    if (/\/create\//.test(location.pathname)) {
        return (
            <Header action={undefined}>
                <HeaderFarmCreate b_name_farm={b_name_farm} />
            </Header>
        )
    }

    const variants: Record<string, () => ReactNode> = {
        "routes/farm._index": () => (
            <Header action={undefined}>
                <HeaderFarm
                    b_id_farm={params.b_id_farm}
                    farmOptions={farmOptions}
                />
            </Header>
        ),
        "routes/farm.$b_id_farm.settings": () => (
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
        "routes/farm.$b_id_farm.fertilizers": () => (
            <Header action={undefined}>
                <HeaderFarm
                    b_id_farm={params.b_id_farm}
                    farmOptions={farmOptions}
                />
                <HeaderFertilizer
                    b_id_farm={params.b_id_farm}
                    p_id={params.p_id}
                    fertilizerOptions={
                        /\/new(\/|$)/.test(location.pathname)
                            ? []
                            : fertilizerOptions
                    }
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
