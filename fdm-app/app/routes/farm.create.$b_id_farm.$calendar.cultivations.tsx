import { getCultivationPlan, getFarm } from "@svenvw/fdm-core"
import {
    data,
    type LoaderFunctionArgs,
    type MetaFunction,
    Outlet,
    useLoaderData,
} from "react-router"
import { FarmContent } from "~/components/blocks/farm/farm-content"
import { FarmTitle } from "~/components/blocks/farm/farm-title"
import { Header } from "~/components/blocks/header/base"
import { HeaderFarmCreate } from "~/components/blocks/header/create-farm"
import { SidebarInset } from "~/components/ui/sidebar"
import { getSession } from "~/lib/auth.server"
import { getCalendar, getTimeframe } from "~/lib/calendar"
import { clientConfig } from "~/lib/config"
import { handleLoaderError } from "~/lib/error"
import { fdm } from "~/lib/fdm.server"

// Meta
export const meta: MetaFunction = () => {
	return [
		{ title: `Bouwplan - Bedrijf toevoegen | ${clientConfig.name}` },
		{
			name: "description",
			content: "Beheer de gewassen op je percelen.",
		},
	];
};

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
export async function loader({ request, params }: LoaderFunctionArgs) {
	try {
		// Get the Id of the farm
		const b_id_farm = params.b_id_farm;
		if (!b_id_farm) {
			throw data("Farm ID is required", {
				status: 400,
				statusText: "Farm ID is required",
			});
		}

		// Get the session
		const session = await getSession(request);

		// Get timeframe from calendar store
		const calendar = getCalendar(params);
		const timeframe = getTimeframe(params);

		const farm = await getFarm(fdm, session.principal_id, b_id_farm).catch(
			(error) => {
				throw data(`Failed to fetch farm: ${error.message}`, {
					status: 404,
					statusText: "Farm not found",
				});
			},
		);

		if (!farm) {
			throw data("Farm not found", {
				status: 404,
				statusText: "Farm not found",
			});
		}

		// Get the cultivationPlan
		const cultivationPlan = await getCultivationPlan(
			fdm,
			session.principal_id,
			b_id_farm,
			timeframe,
		);

		// Create the sidenav
		const sidebarPageItems = cultivationPlan.map((cultivation) => {
			return {
				title: cultivation.b_lu_name,
				to: `/farm/create/${b_id_farm}/${calendar}/cultivations/${cultivation.b_lu_catalogue}`,
			};
		});

		return {
			cultivationPlan: cultivationPlan,
			sidebarPageItems: sidebarPageItems,
			b_id_farm: b_id_farm,
			b_name_farm: farm.b_name_farm,
			calendar: calendar,
		};
	} catch (error) {
		throw handleLoaderError(error);
	}
}

// Main
export default function Index() {
	const loaderData = useLoaderData<typeof loader>();

	return (
		<SidebarInset>
			<Header action={undefined}>
				<HeaderFarmCreate b_name_farm={loaderData.b_name_farm} />
			</Header>
			<main>
				<>
					<FarmTitle
						title={"Bouwplan"}
						description={"Werk de eigenschappen per gewas in je bouwplan bij."}
						action={{
							to: `/farm/create/${loaderData.b_id_farm}/${loaderData.calendar}/access`,
							label: "Doorgaan",
						}}
					/>
					<FarmContent sidebarItems={loaderData.sidebarPageItems}>
						<Outlet />
					</FarmContent>
				</>
			</main>
		</SidebarInset>
	);
}
