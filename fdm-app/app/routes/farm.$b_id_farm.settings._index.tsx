import { type MetaFunction, redirect } from "react-router"
import config from "~/fdm.config"

// Meta
export const meta: MetaFunction = () => {
    return [
        { title: `Instellingen  - Bedrijf | ${config.name}` },
        {
            name: "description",
            content: "Bekijk en bewerk de instellingen van je bedrijf.",
        },
    ]
}

export async function loader() {
    // Redirect to properties page
    return redirect("./properties")
}
