import { lookupPrincipal } from "@svenvw/fdm-core"
import type { ActionFunctionArgs } from "react-router"
import { handleActionError } from "~/lib/error"
import { getSession } from "~/lib/auth.server"
import { extractFormValuesFromRequest } from "~/lib/form"
import { fdm } from "../lib/fdm.server"
import { z } from "zod"

export async function action({ request }: ActionFunctionArgs) {
    try {
        // Get the session
        const session = await getSession(request)

        const formValues = await extractFormValuesFromRequest(
            request,
            FormSchema,
        )
        const identifier = formValues.identifier

        const principals = await lookupPrincipal(fdm, identifier)

        return principals
    } catch (error) {
        return handleActionError(error)
    }
}

export const FormSchema = z.object({
    identifier: z.string(),
})
