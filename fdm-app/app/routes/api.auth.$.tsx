import type {
    ActionFunctionArgs,
    LoaderFunctionArgs,
    MetaFunction,
} from "react-router"
import { auth } from "@/lib/auth.server"
import { handleActionError, handleLoaderError } from "@/lib/error"

export const meta: MetaFunction = () => {
    return [
        { title: "FDM App" },
        { name: "description", content: "Welcome to FDM!" },
    ]
}

export async function loader({ request }: LoaderFunctionArgs) {
    try {
        return auth.handler(request)
    } catch (error) {
        return handleLoaderError(error)
    }
}

// Action
export async function action({ request }: ActionFunctionArgs) {
    try {
        return auth.handler(request)
    } catch (error) {
        return handleActionError(error)
    }
}
