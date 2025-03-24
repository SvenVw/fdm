import type { MetaFunction } from "react-router"
import config from "~/fdm.config"

// Meta
export const meta: MetaFunction = () => {
    return [
        { title: `Vanggewas - Bouwplan - Bedrijf toevoegen | ${config.name}` },
        {
            name: "description",
            content:
                "Bekijk en selecteer het vanggewas uit je bouwplan.",
        },
    ]
}

export default function Index() {
    return (
        <div className="space-y-6">
            <div>
                <p className="text-sm text-muted-foreground">
                    Vanggewas wordt binnenkort toegevoegd
                </p>
            </div>
        </div>
    )
}
