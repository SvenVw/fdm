import {  redirect } from "react-router";

export async function loader() {

    // Redirect to settings page
    return redirect('./settings')
}