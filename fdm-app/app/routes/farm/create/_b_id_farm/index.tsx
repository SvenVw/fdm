import { redirect } from "react-router";

export async function loader() {

    return redirect("./atlas");

    // TOOD: A page where the user could update the values of the farm
}