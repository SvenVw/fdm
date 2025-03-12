import { type MetaFunction, redirect } from "react-router"

// Meta
export const meta: MetaFunction = () => {
    return [
        { title: "Instellingen  - Bedrijf | MINAS2" },
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
