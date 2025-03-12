import type { MetaFunction } from "react-router"

// Meta
export const meta: MetaFunction = () => {
    return [
        { title: "Vanggewas - Bouwplan - Bedrijf toevoegen | MINAS2" },
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
