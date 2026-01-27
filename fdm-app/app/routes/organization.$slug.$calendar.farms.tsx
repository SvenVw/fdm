import { getFarms, getFields, listPrincipalsForFarm } from "@svenvw/fdm-core"
import { data, useLoaderData } from "react-router"
import { FarmContent } from "~/components/blocks/farm/farm-content"
import { FarmTitle } from "~/components/blocks/farm/farm-title"
import { columns } from "~/components/blocks/farms/columns"
import { DataTable } from "~/components/blocks/farms/table"
import { auth } from "~/lib/auth.server"
import { getTimeframe } from "~/lib/calendar"
import { handleLoaderError } from "~/lib/error"
import { fdm } from "~/lib/fdm.server"
import type { Route } from "./+types/organization.$slug.$calendar.farms"

export async function loader({ params, request }: Route.LoaderArgs) {
    try {
        const timeframe = getTimeframe(params)

        const organizations = await auth.api.listOrganizations({
            headers: request.headers,
        })
        const organization = organizations.find(
            (org) => org.slug === params.slug,
        )

        if (!organization) {
            throw data("Organisatie niet gevonden.", 404)
        }

        const farms = await getFarms(fdm, organization.id)

        const allFarms = await Promise.all(
            farms.map(async (farm) => {
                const myOrganization = organization
                async function getOwner() {
                    const accessors = (
                        await listPrincipalsForFarm(
                            fdm,
                            myOrganization.id,
                            farm.b_id_farm,
                        )
                    ).filter((accessor) => accessor.type === "user")

                    return (
                        accessors.find(
                            (accessor) => accessor.role === "owner",
                        ) ??
                        accessors.find(
                            (accessor) => accessor.role === "advisor",
                        )
                    )
                }

                async function reduceFields() {
                    const fields = await getFields(
                        fdm,
                        myOrganization.id,
                        farm.b_id_farm,
                        timeframe,
                    )

                    let b_area = 0
                    const cultivations: Record<
                        string,
                        { b_lu_name: string; b_lu_croprotation: string }
                    > = {}
                    const fertilizers: Record<
                        string,
                        { p_name_nl: string; p_type: string }
                    > = {}

                    fields.forEach((field) => {
                        b_area += field.b_area ?? 0
                    })

                    return {
                        fields: fields.map((field) => ({
                            type: "field",
                            b_id_farm: field.b_id,
                            b_name_farm: field.b_name,
                            owner: null,
                            b_area: field.b_area,
                            cultivations: [],
                            fertilizers: [],
                        })),
                        b_area: b_area,
                        cultivations: Object.values(cultivations),
                        fertilizers: Object.values(fertilizers),
                    }
                }

                const ownerPromise = getOwner()
                const reduceFieldsPromise = reduceFields()

                return {
                    type: "farm",
                    b_id_farm: farm.b_id_farm,
                    b_name_farm: farm.b_name_farm,
                    owner: await ownerPromise,
                    ...(await reduceFieldsPromise),
                }
            }),
        )

        return {
            data: allFarms,
            organization,
        }
    } catch (e) {
        throw handleLoaderError(e)
    }
}
export default function OrganizationFarmsPage() {
    const { data, organization } = useLoaderData<typeof loader>()
    return (
        <main>
            <FarmTitle
                title={`Bedrijven met toegang door ${organization.name}`}
                description="Klik op een bedrijfsnaam voor meer informatie."
                action={{
                    label: "Terug naar overzicht",
                    to: `/organization/${organization.slug}`,
                }}
            />
            {data.length ? (
                <FarmContent>
                    <div className="flex flex-col space-y-8 pb-10 lg:flex-row lg:space-x-12 lg:space-y-0">
                        <DataTable columns={columns} data={data} />
                    </div>
                </FarmContent>
            ) : (
                <div className="mx-auto flex h-full w-full items-center flex-col justify-center space-y-6 sm:w-[350px]">
                    <div className="flex flex-col space-y-2 text-center">
                        <h1 className="text-2xl font-semibold tracking-tight">
                            Het lijkt erop dat je nog geen bouwplan hebt :(
                        </h1>
                        <p>
                            Neem contact op met bedrijven om toegang tot hen te
                            krijgen.
                        </p>
                    </div>
                </div>
            )}
        </main>
    )
}
