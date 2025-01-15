import { Separator } from "@/components/ui/separator";

export default function FarmSettingsDeleteBlock() {

    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-lg font-medium">Verwijderen</h3>
                <p className="text-sm text-muted-foreground">
                    Helaas, je hebt geen rechten om dit bedrijf te kunnen verwijderen.
                </p>
            </div>
            <Separator />
        </div>
    )
}