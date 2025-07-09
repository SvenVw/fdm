import type { LoaderFunctionArgs, MetaFunction } from "react-router"
import { Link } from "react-router-dom"
import { Header } from "~/components/blocks/header/base"
import { HeaderFarmCreate } from "~/components/blocks/header/create-farm"
import { Button } from "~/components/ui/button"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "~/components/ui/card"
import { SidebarInset } from "~/components/ui/sidebar"
import { clientConfig } from "~/lib/config"

// Meta
export const meta: MetaFunction = () => {
    return [
        {
            title: `Percelen importeren - Bedrijf toevoegen | ${clientConfig.name}`,
        },
        {
            name: "description",
            content: "Importeer de percelen van je bedrijf.",
        },
    ]
}

export async function loader({ params }: LoaderFunctionArgs) {
    const b_id_farm = params.b_id_farm
    if (!b_id_farm) {
        throw new Error("b_id_farm is required")
    }
    return { b_id_farm }
}

export default function ChooseFieldImportMethod() {
    return (
        <SidebarInset>
            <Header action={undefined}>
                <HeaderFarmCreate b_name_farm={undefined} />
            </Header>
            <main>
                <div className="flex h-screen items-center justify-center">
                    <Card className="w-[450px]">
                        <CardHeader>
                            <CardTitle>Percelen importeren</CardTitle>
                            <CardDescription>
                                Hoe wil je de percelen van je bedrijf
                                importeren?
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="grid gap-4">
                            <Link to="./upload">
                                <Button className="w-full">
                                    Upload Shapefile van RVO Mijn Percelen
                                </Button>
                            </Link>
                            <Link to="./atlas">
                                <Button variant="outline" className="w-full">
                                    Selecteer percelen van de kaart
                                </Button>
                            </Link>
                        </CardContent>
                    </Card>
                </div>
            </main>
        </SidebarInset>
    )
}
