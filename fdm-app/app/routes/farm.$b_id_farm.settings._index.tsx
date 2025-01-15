import { redirect } from "react-router"

export async function loader() {
    // Redirect to properties page
    return redirect("./properties")
}
