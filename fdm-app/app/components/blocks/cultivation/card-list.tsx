import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card"
import { CultivationAddFormDialog } from "./form-add"
import type { Cultivation, CultivationOption } from "./types"
import { CultivationList } from "./list"

interface Harvest {
    b_lu: string
    b_lu_harvest_date: Date
    b_lu_yield: number
    b_lu_n_harvestable: number
}

export function CultivationListCard({
    cultivationsCatalogueOptions,
    cultivations,
    harvests,
}: {
    cultivationsCatalogueOptions: CultivationOption[]
    cultivations: Cultivation[]
    harvests: Harvest[]
}) {
    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-xl font-semibold tracking-tight text-gray-900">Gewassen</CardTitle>
                {cultivations.length !== 0 ? (
                    <CultivationAddFormDialog
                        options={cultivationsCatalogueOptions}
                    />
                ) : null}
            </CardHeader>
            <CardContent>
                {cultivations.length !== 0 ? (
                    <CultivationList
                        cultivations={cultivations}
                        harvests={harvests}
                    />
                ) : (
                    <div className="mx-auto flex h-full w-full items-center flex-col justify-center space-y-6">
                        <div className="flex flex-col space-y-2 text-center">
                            <h1 className="text-2xl font-semibold tracking-tight">
                                Dit perceel heeft nog geen gewas voor dit jaar
                            </h1>
                            <p className="text-sm text-muted-foreground">
                                Voeg een gewas toe voor dit perceel om gegevens
                                zoals, zaai- en oogstdatum en opbrengst bij te
                                houden.
                            </p>
                            <CultivationAddFormDialog
                                options={cultivationsCatalogueOptions}
                            />
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
