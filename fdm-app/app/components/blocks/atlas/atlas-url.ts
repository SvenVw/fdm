import { clientConfig } from "@/app/lib/config"

export function getAvailableFieldsUrl(calendar: string): string {
    // Get URL of FDM public datasets
    const datasetsUrl = clientConfig.datasets_url

    // Set year accoriding to available at FDM public datasets
    let year = Math.round(Number(calendar))
    if (year < 2020) {
        year = 2020
    }
    if (year > 2025) {
        year = 2025
    }

    // Set version according to availability at FDM public datasets
    let version = "definitive"
    if (year >= 2024) {
        version = "draft"
    }

    // Create the url
    const availableFieldsUrl = `${datasetsUrl}/fields/nl/${year}/${version}.fgb`
    return availableFieldsUrl
}
