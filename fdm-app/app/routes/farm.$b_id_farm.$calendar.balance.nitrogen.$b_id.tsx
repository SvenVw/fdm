import type { LoaderFunctionArgs, MetaFunction } from "react-router"
import { clientConfig } from "~/lib/config"

// Meta
export const meta: MetaFunction = () => {
    return [
        { title: `Stikstof - Perceel - Nutritentbalans| ${clientConfig.name}` },
        {
            name: "description",
            content: "Bekijk stikstof voor je nutriëntenbalans.",
        },
    ]
}

export async function loader({ request, params }: LoaderFunctionArgs) {
    return {
        test: "hi",
    }
}

export default function FarmBalanceNitrogenFieldBlock() {
    return (
        <>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">hi</div>
        </>
    )
}
