import { NavLink, useLoaderData, type MetaFunction } from "react-router"
import { Header } from "~/components/blocks/header/base"
import { HeaderFarmCreate } from "~/components/blocks/header/create-farm"
import { clientConfig } from "~/lib/config"
import {
    action as originalAction,
    loader as originalLoader,
} from "./farm.$b_id_farm.$calendar.rotation._index"
import { FarmTitle } from "../components/blocks/farm/farm-title"
import { Button } from "../components/ui/button"
import { FarmContent } from "../components/blocks/farm/farm-content"
import { DataTable } from "../components/blocks/rotation/table"
import { columns } from "../components/blocks/rotation/columns"

// Meta
export const meta: MetaFunction = () => {
    return [
        { title: `Bouwplan - Bedrijf toevoegen | ${clientConfig.name}` },
        {
            name: "description",
            content: "Beheer de gewassen op je percelen.",
        },
    ]
}

/**
 * Loads data required for the farm cultivations page.
 *
 * This loader verifies that a farm ID is provided in the URL parameters and uses the current user session to fetch
 * the corresponding farm details. It then retrieves the cultivation plan for the farm and constructs sidebar navigation
 * items based on the available cultivations.
 *
 * @returns An object containing:
 * - cultivationPlan: An array of cultivation entries.
 * - sidebarPageItems: An array of navigation items for the sidebar.
 * - b_id_farm: The farm identifier.
 * - b_name_farm: The name of the farm.
 *
 * @throws {Response} 400 if the farm ID is missing.
 * @throws {Response} 404 if the farm is not found.
 */
export async function loader(props) {
    return originalLoader(props)
}

export default function FarmCreateRotationIndex() {
    const loaderData = useLoaderData()
    const currentFarmName =
        loaderData.farmOptions.find(
            (farm) => farm.b_id_farm === loaderData.b_id_farm,
        )?.b_name_farm ?? ""
    return (
        <>
            <Header
                action={{
                    to: `/farm/create/${loaderData.b_id_farm}/${loaderData.calendar}/fertilizers`,
                    label: "Doorgaan",
                }}
            >
                <HeaderFarmCreate b_name_farm={loaderData.b_name_farm} />
            </Header>
            <main>
                {loaderData.fieldOptions.length === 0 ? (
                    <>
                        <FarmTitle
                            title={`Bouwplan van ${currentFarmName}`}
                            description="Dit bedrijf heeft nog geen bouwplan"
                        />
                        <div className="mx-auto flex h-full w-full items-center flex-col justify-center space-y-6 sm:w-[350px]">
                            <div className="flex flex-col space-y-2 text-center">
                                <h1 className="text-2xl font-semibold tracking-tight">
                                    Het lijkt erop dat je nog geen bouwplan hebt
                                    :(
                                </h1>
                            </div>
                            <div className="flex flex-col items-center relative">
                                <Button
                                    asChild
                                    className={cn(
                                        !loaderData.farmWritePermission
                                            ? "invisible"
                                            : "",
                                    )}
                                >
                                    <NavLink to="../field/new">
                                        Maak een perceel
                                    </NavLink>
                                </Button>
                            </div>
                        </div>
                    </>
                ) : (
                    <>
                        <div className="flex items-center justify-between">
                            <FarmTitle
                                title={`Bouwplan van ${currentFarmName}`}
                                description="Bekijk het bouwplan en voeg gegevens toe."
                            />
                        </div>
                        <FarmContent>
                            <div className="flex flex-col space-y-8 pb-10 lg:flex-row lg:space-x-12 lg:space-y-0">
                                <DataTable
                                    columns={columns}
                                    data={loaderData.rotationExtended}
                                    canAddItem={loaderData.farmWritePermission}
                                />
                            </div>
                        </FarmContent>
                    </>
                )}
            </main>
        </>
    )
}

export async function action(props) {
    return originalAction(props)
}
