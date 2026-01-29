import type {
    CurrentSoilData,
    SoilParameterDescription,
} from "@svenvw/fdm-core"
import { Plus } from "lucide-react"
import { NavLink, useLocation } from "react-router"
import { SoilDataCards } from "~/components/blocks/soil/cards"
import { Button } from "~/components/ui/button"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "~/components/ui/card"
import { Separator } from "~/components/ui/separator"

export function NewFieldSoilAnalysisBlock({
    b_id,
    currentSoilData,
    soilParameterDescription,
}: NewFieldSoilAnalysisBlockProps) {
    const location = useLocation()

    return (
        <Card>
            <CardHeader>
                <CardTitle>Bodem</CardTitle>
                <CardDescription>
                    Voeg een bodemanalyse toe voor dit perceel of bekijk de
                    schatting door NMI.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <Button asChild>
                            <NavLink
                                to={`../${b_id}/soil/analysis${location.search}`}
                            >
                                <Plus />
                                Bodemanalyse toevoegen
                            </NavLink>
                        </Button>
                    </div>
                    <Separator />
                    <div className="">
                        <SoilDataCards
                            currentSoilData={currentSoilData}
                            soilParameterDescription={soilParameterDescription}
                        />
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}

type NewFieldSoilAnalysisBlockProps = {
    b_id: string
    currentSoilData: CurrentSoilData
    soilParameterDescription: SoilParameterDescription
}
