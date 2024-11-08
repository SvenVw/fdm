import { redirect } from "@remix-run/node"

export async function loader() {

    // Temporary until iam is completed
    return redirect("../signup");
}