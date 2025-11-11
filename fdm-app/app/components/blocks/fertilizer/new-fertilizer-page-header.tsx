import { useLoaderData, useParams, useSearchParams } from "react-router"
import { Header } from "~/components/blocks/header/base"
import { HeaderFarmCreate } from "~/components/blocks/header/create-farm"
import { HeaderFarm } from "~/components/blocks/header/farm"
import { HeaderFertilizer } from "~/components/blocks/header/fertilizer"
import { HeaderField } from "~/components/blocks/header/field"
import { BreadcrumbLink, BreadcrumbSeparator } from "~/components/ui/breadcrumb"

/**
 * Returns the appropriate new fertilizer page header based on the `returnUrl`\
 * search param.
 *
 * `b_id_farm` is assumed to be in the route params for the farm fertilizer
 * route.
 *
 * `b_name_farm`, `farmOptions`, and `fieldOptions` are assumed to exist in the
 * loader data when needed for the route.
 *
 * If `returnUrl` is present as a search param, the application will return here
 * when the fertilizer creation is complete or the user clicks the button in
 * this component.
 */
export function NewFertilizerPageHeader() {
    const [searchParams] = useSearchParams()
    const params = useParams()
    const { b_name_farm, farmOptions, fieldOptions } = useLoaderData()
    const returnUrl = searchParams.get("returnUrl") ?? ""
    const parsedReturnUrl = returnUrl
        ? new URL(
              returnUrl.startsWith("/")
                  ? `http://localhost${returnUrl}`
                  : returnUrl,
          )
        : null

    const singleFieldMatch = returnUrl.match(
        /farm\/([^/]*)\/([^/]*)\/field\/([^/]*)\/fertilizer/,
    )
    if (singleFieldMatch) {
        const [_, b_id_farm, calendar, b_id] = singleFieldMatch
        return (
            <Header
                action={{
                    label: "Terug naar bemesting toevoegen",
                    to: `/farm/${b_id_farm}/${calendar}/field/${b_id}/fertilizer`,
                    disabled: false,
                }}
            >
                <HeaderFarm
                    b_id_farm={b_id_farm}
                    farmOptions={farmOptions ?? []}
                />
                <HeaderField
                    b_id_farm={b_id_farm || ""}
                    fieldOptions={fieldOptions}
                    b_id={b_id}
                />
                <BreadcrumbLink
                    href={`/farm/${b_id_farm}/${calendar}/field/${b_id}/fertilizer/manage/new`}
                >
                    Nieuwe meststof
                </BreadcrumbLink>
            </Header>
        )
    }

    const multipleFieldsMatch = returnUrl.match(
        /farm\/([^/]*)\/([^/]*)\/field\/fertilizer/,
    )
    if (multipleFieldsMatch) {
        const [_, b_id_farm, calendar] = multipleFieldsMatch
        return (
            <Header
                action={{
                    label: "Terug naar bemesting toevoegen",
                    to: returnUrl,
                    disabled: false,
                }}
            >
                <HeaderFarm
                    b_id_farm={b_id_farm}
                    farmOptions={farmOptions ?? []}
                />
                <BreadcrumbSeparator />
                Percelen
                <BreadcrumbSeparator />
                <BreadcrumbLink href={returnUrl}>
                    Bemesting toevoegen
                </BreadcrumbLink>
                <BreadcrumbSeparator />
                <BreadcrumbLink
                    href={`/farm/${b_id_farm}/${calendar}/field/fertilizer/manage/new?fieldIds=${parsedReturnUrl?.searchParams.get("fieldIds")}`}
                >
                    Nieuwe meststof
                </BreadcrumbLink>
            </Header>
        )
    }

    const createMatch = /farm\/create/.test(returnUrl)
    if (createMatch) {
        return (
            <Header
                action={{
                    label: "Terug naar bemesting toevoegen",
                    to: returnUrl,
                    disabled: false,
                }}
            >
                <HeaderFarmCreate b_name_farm={b_name_farm} />
            </Header>
        )
    }

    const { b_id_farm } = params
    return (
        <Header
            action={{
                to: `/farm/${b_id_farm}/fertilizers`,
                label: "Terug naar overzicht",
                disabled: false,
            }}
        >
            <HeaderFarm b_id_farm={b_id_farm} farmOptions={farmOptions} />
            <HeaderFertilizer
                b_id_farm={b_id_farm || ""}
                p_id={undefined}
                fertilizerOptions={[]}
            />
        </Header>
    )
}
