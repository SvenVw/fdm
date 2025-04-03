import { Separator } from "~/components/ui/separator"
import type { MetaFunction } from "react-router"
import { clientConfig } from "~/lib/config"

// Meta
export const meta: MetaFunction = () => {
    return [
        { title: `Verwijderen - Instellingen - Bedrijf | ${clientConfig.name}` },
        {
            name: "description",
            content: "Verwijder de gegevens van je bedrijf.",
        },
    ]
}

export default function FarmSettingsDeleteBlock() {
    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-lg font-medium">Verwijderen</h3>
                <p className="text-sm text-muted-foreground">
                    Helaas, je hebt geen rechten om dit bedrijf te kunnen
                    verwijderen.
                </p>
            </div>
            <Separator />
        </div>
    )
}
