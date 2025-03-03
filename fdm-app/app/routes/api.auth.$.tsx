import type {
    ActionFunctionArgs,
    LoaderFunctionArgs,
    MetaFunction,
} from "react-router"
import { auth } from "@/lib/auth.server"
import { handleActionError } from "@/lib/error"

export const meta: MetaFunction = () => {
    return [
        { title: "FDM App" },
        { name: "description", content: "Welcome to FDM!" },
    ]
}

export async function loader({ request }: LoaderFunctionArgs) {
    return auth.handler(request)
}

// Action
export async function action({ request }: ActionFunctionArgs) {
    try {
        return auth.handler(request)
    } catch (error) {
        return handleActionError(error)
    }
}
