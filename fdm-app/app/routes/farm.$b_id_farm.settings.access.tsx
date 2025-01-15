import { Separator } from "@/components/ui/separator"

export default function FarmSettingsAccessBlock() {
    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-lg font-medium">Toegang</h3>
                <p className="text-sm text-muted-foreground">
                    Helaas, je hebt geen rechten om de toegang van dit bedrijf
                    te beheren
                </p>
            </div>
            <Separator />
        </div>
    )
}
