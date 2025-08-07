import { clientConfig } from "@/app/lib/config"

export function getAvailableFieldsUrl(calendar: string): string {
    // Get URL of FDM public datasets
    const datasetsUrl = clientConfig.datasets_url

    //  Set year according to available at FDM public datasets
    const parsedYear = Number.parseInt(calendar, 10)
    if (Number.isNaN(parsedYear)) {
        throw new Error(`Invalid calendar year: ${calendar}`)
    }
    const year = Math.max(2020, Math.min(2025, parsedYear))

    // Set version according to availability at FDM public datasets
    let version = "definitive"
    if (year >= 2024) {
        version = "draft"
    }

    // Create the url
    const availableFieldsUrl = `${datasetsUrl}/fields/nl/${year}/${version}.fgb`
    return availableFieldsUrl
}
