import { type MetaFunction, type LoaderFunctionArgs, data } from "react-router";
import { useLoaderData } from "react-router";

// Components
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ComboboxFertilizers } from "@/components/custom/combobox-fertilizers";
import { ComboboxCultivations } from "@/components/custom/combobox-cultivations";

// Blocks
import Cultivation from "@/components/blocks/cultivation-plan";

// FDM
import { fdm } from "../services/fdm.server";
import { getCultivationPlan, getCultivationsFromCatalogue, getFertilizersFromCatalogue } from "@svenvw/fdm-core";

// Meta
export const meta: MetaFunction = () => {
    return [
        { title: "FDM App" },
        { name: "description", content: "Welcome to FDM!" },
    ];
};

// Loader
export async function loader({
    request, params
}: LoaderFunctionArgs) {

    // Get the Id of the farm
    const b_id_farm = params.b_id_farm
    if (!b_id_farm) {
        throw data("Farm ID is required", { status: 400, statusText: "Farm ID is required" });
    }

    // Get the cultivation
    const b_lu_catalogue = params.b_lu_catalogue
    if (!b_lu_catalogue) {
        throw data("Cultivation catalogue ID is required", { status: 400, statusText: "Cultivation catalogue ID is required" });
    }

    // Get the cultivation details for this cultivation
    const cultivationPlan = await getCultivationPlan(fdm, b_id_farm).catch(error => {
        throw data("Failed to fetch cultivation plan", { status: 500, statusText: error.message });
    });

    const cultivation = cultivationPlan.find(cultivation => cultivation.b_lu_catalogue === b_lu_catalogue);
    if (!cultivation) {
        throw data("Cultivation not found", { status: 404, statusText: "Cultivation not found" });
    }

    // Cultivation options
    const cultivationsCatalogue = await getCultivationsFromCatalogue(fdm)
    const cultivationOptions = cultivationsCatalogue.map(cultivation => {
        return {
            value: cultivation.b_lu_catalogue,
            label: cultivation.b_lu_name
        }
    })

    // Fertilizer options
    const fertilizersCatalogue = await getFertilizersFromCatalogue(fdm)
    const fertilizerOptions = fertilizersCatalogue.map(fertilizer => {
        return {
            value: fertilizer.p_id_catalogue,
            label: fertilizer.p_name_nl
        }
    })

    return {
        b_lu_catalogue: b_lu_catalogue,
        b_id_farm: b_id_farm,
        cultivation: cultivation,
        fertilizerOptions: fertilizerOptions,
        cultivationOptions: cultivationOptions
    }
}

// Main
export default function Index() {
    const loaderData = useLoaderData<typeof loader>();

    // Get field names
    let fieldNames = loaderData.cultivation.fields.map(field => field.b_name)
    if (fieldNames.length > 1) {
        fieldNames = fieldNames.join(", ")
        fieldNames = fieldNames.replace(/,(?=[^,]+$)/, ', en') //Replace last comma with and        
    }


    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-lg font-medium">{loaderData.cultivation.b_lu_name}</h3>
                <p className="text-sm text-muted-foreground">
                    {fieldNames}
                </p>
            </div>
            <Tabs defaultValue="cultivation_main" className="w-full">
                <TabsList>
                    <TabsTrigger value="cultivation_main">Hoofdgewas</TabsTrigger>
                    <TabsTrigger value="fertilizations">Bemesting </TabsTrigger>
                    <TabsTrigger value="cultivation_cover">Vanggewas</TabsTrigger>
                </TabsList>
                <TabsContent value="cultivation_main">
                    <Cultivation
                        cultivation={loaderData.cultivation}
                        fertilizerOptions={loaderData.fertilizerOptions}
                        cultivationOptions={loaderData.cultivationOptions}
                    />
                </TabsContent>
                <TabsContent value="fertilizations">
                    <div className="space-y-6">
                        <p className="text-sm text-muted-foreground">
                            Vul de bemesting op bouwplanniveau in voor dit gewas.
                        </p>
                        <ComboboxFertilizers
                            action={`/app/addfarm/${loaderData.b_id_farm}/cultivations/${loaderData.b_lu_catalogue}`}
                            options={loaderData.fertilizerOptions}
                        />
                    </div>
                </TabsContent>
                <TabsContent value="cultivation_cover">
                    <div className="space-y-6">
                        <p className="text-sm text-muted-foreground">
                            Teelt je een vanggewas na dit gewas? Voeg dat hier toe.
                        </p>
                        <ComboboxCultivations
                            options={loaderData.cultivationOptions}
                        />
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}

export async function action({
    request, params
}: ActionFunctionArgs) {

    const b_id_farm = params.b_id_farm
    const b_lu_catalogue = params.b_lu_catalogue
    const formData = await request.formData()
    const form  = formData.get('form')


    if ( form === 'addFertilizer') {
        return json({ success: true })        
    } else {
        throw new Error("Invalid POST actionForm")    
    }

}