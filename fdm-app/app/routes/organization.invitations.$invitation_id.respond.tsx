import {
    acceptInvitation,
    getPendingInvitation,
    rejectInvitation,
} from "@svenvw/fdm-core"
import {
    type ActionFunctionArgs,
    data,
    type LoaderFunctionArgs,
    redirect,
    useLoaderData,
} from "react-router"
import { redirectWithSuccess } from "remix-toast"
import z from "zod"
import { Button } from "~/components/ui/button"
import {
    Card,
    CardContent,
    CardFooter,
    CardHeader,
    CardTitle,
} from "~/components/ui/card"
import { getSession } from "~/lib/auth.server"
import { fdm } from "~/lib/fdm.server"
import { extractFormValuesFromRequest } from "~/lib/form"

export async function loader({ request, params }: LoaderFunctionArgs) {
    const session = await getSession(request)

    // Check for valid invitation id
    if (!params.invitation_id) {
        throw failBadRequest("Bad Request: invitation id missing")
    }

    // Check for valid intent
    if (request.url.indexOf("?") === -1) {
        throw failBadRequest("Bad Request: intent missing")
    }

    const searchParams = new URLSearchParams(
        request.url.substring(request.url.indexOf("?") + 1),
    )

    if (!searchParams.has("intent")) {
        throw failBadRequest("Bad Request: intent missing")
    }

    let accepted: boolean
    if (searchParams.get("intent")?.toLowerCase() === "accept") {
        accepted = true
    } else if (searchParams.get("intent")?.toLowerCase() === "reject") {
        accepted = false
    } else {
        throw failBadRequest(
            `Bad Request: bad intent: ${searchParams.get("intent")}`,
        )
    }

    const invitation = await getPendingInvitation(fdm, params.invitation_id)
    if (!invitation) {
        throw failNotFound("Uitnodiging niet gevonden of is verloopt.")
    }

    // If accepted process the request and redirect to the organizations page
    if (accepted) {
        await acceptInvitation(fdm, params.invitation_id, session.user.id)
        return redirectWithSuccess("/organization", {
            message: "Uitnodiging geaccepteerd! 🎉",
        })
    }

    // Collect loader data and show the rejection confirmation page
    return {
        invitationId: invitation.invitation_id,
        inviterFirstName: invitation.inviter_firstname,
        inviterSurname: invitation.inviter_surname,
        organizationName: invitation.organization_name,
        role: invitation.role,
    }
}

export default function Respond() {
    const {
        invitationId,
        inviterFirstName,
        inviterSurname,
        organizationName,
        role,
    } = useLoaderData()
    return (
        <div className="max-w-3xl mx-auto my-4 px-4">
            <Card>
                <CardHeader>
                    <CardTitle>Uitnodiging Afwijzen</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="my-1">
                        {`${inviterFirstName} ${inviterSurname} heeft je uitgenodigd om lid te worden van de organisatie `}
                        <span className="font-semibold">{`${organizationName}.`}</span>
                    </p>
                    <p className="my-1">
                        Je bent uitgenodigd als{" "}
                        <i className="font-semibold">{role}</i>
                    </p>
                    <p className="my-1">
                        Weet je zeker dat je deze uitnodiging wilt afwijzen?
                    </p>
                </CardContent>
                <CardFooter>
                    <form method="post" className="flex flex-row gap-2">
                        <input
                            type="hidden"
                            name="invitation_id"
                            value={invitationId}
                        />
                        <Button
                            variant="destructive"
                            name="intent"
                            value="reject"
                        >
                            Ja, afwijzen
                        </Button>
                        <Button
                            variant="secondary"
                            name="intent"
                            value="do_nothing"
                        >
                            Nee, terug naar mijn uitnodigingen
                        </Button>
                    </form>
                </CardFooter>
            </Card>
        </div>
    )
}

const FormSchema = z.object({
    invitation_id: z.string(),
    intent: z.enum(["accept", "reject", "do_nothing"]),
})

export async function action({ request }: ActionFunctionArgs) {
    const formValues = await extractFormValuesFromRequest(request, FormSchema)

    const session = await getSession(request)

    if (formValues.intent === "reject") {
        await rejectInvitation(fdm, formValues.invitation_id, session.user.id)
        return redirectWithSuccess("/organization", {
            message: "Uitnodiging afgewezen",
        })
    }
    if (formValues.intent === "do_nothing") {
        return redirect("/organization/invitations")
    }
    throw new Error("invalid intent")
}

function failBadRequest(message: string) {
    // Not 400 because 400 currently hits the Not Found error page
    return fail(message, 500)
}

function failNotFound(message: string) {
    return fail(message, 404)
}

function fail(message: string, status: number) {
    return data(message, { statusText: message, status: status })
}
