import { type LoaderFunctionArgs, redirect } from "react-router"

export async function loader({ request, params }: LoaderFunctionArgs) {
    // Redirect to crop block
    return redirect("crop")
}
