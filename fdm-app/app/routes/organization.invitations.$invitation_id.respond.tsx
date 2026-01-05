import { useEffect } from "react"
import {
    type ActionFunctionArgs,
    data,
    isRouteErrorResponse,
    type LoaderFunctionArgs,
    redirect,
    useLoaderData,
    useSearchParams,
    useSubmit,
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
import { Separator } from "~/components/ui/separator"
import { auth, getSession } from "~/lib/auth.server"
import { extractFormValuesFromRequest } from "~/lib/form"
import type { Route } from "../+types/root"

export async function loader({ request, params }: LoaderFunctionArgs) {
    await getSession(request)

    // Check for valid invitation id
    if (!params.invitation_id) {
        throw failBadRequest("Bad Request: invitation id missing")
    }

    // Check for valid invitation
    try {
        const invitations = await auth.api.listUserInvitations({
            headers: request.headers,
        })

        const invitation = invitations.find(
            (inv) => inv.id === params.invitation_id,
        )

        if (!invitation) {
            throw new Error("Invitation not found")
        }

        return { invitation }
    } catch (_e) {
        throw data("Invitation not found", 404)
    }
}

export default function Respond() {
    const { invitation } = useLoaderData()

    const [searchParams] = useSearchParams()
    const intentRaw = searchParams.get("intent")
    const intent = intentRaw != null ? intentRaw.toLowerCase() : null

    const submit = useSubmit()

    useEffect(() => {
        if (intent && intent === "accept") {
            submit(
                {
                    invitation_id: invitation.id,
                    intent: "accept",
                    organization_slug: invitation.organization.slug,
                },
                { method: "POST" },
            )
        }
    }, [intent, submit, invitation.id, invitation.organization.slug])

    if (intent !== "accept" && intent !== "reject") {
        throw failBadRequest(`Invalid intent: ${intent}`)
    }

    if (intent === "accept") {
        return (
            <h1 className="font-semibold mt-[200px] text-3xl text-center text-primary">
                Uitnodiging wordt geaccepteerd...
            </h1>
        )
    }

    return (
        <div className="max-w-3xl mx-auto my-4 px-4">
            <Card>
                <CardHeader>
                    <CardTitle>Uitnodiging afwijzen</CardTitle>
                </CardHeader>
                <CardContent>
                    <Separator />
                    <p className="my-1">
                        {`${invitation.inviter?.name || "Iemand"} heeft je uitgenodigd om lid te worden van de organisatie `}
                        <span className="font-semibold">{`${invitation.organization.name}.`}</span>
                    </p>
                    <p className="my-1">
                        Je bent uitgenodigd als{" "}
                        <i className="font-semibold">{invitation.role}</i>
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
                            value={invitation.id}
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
                            Nee, terug naar Mijn Uitnodigingen
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
    organization_slug: z.string().optional(),
})

export async function action({ request }: ActionFunctionArgs) {
    const formValues = await extractFormValuesFromRequest(request, FormSchema)

    await getSession(request)

    if (formValues.intent === "accept") {
        try {
            await auth.api.acceptInvitation({
                headers: request.headers,
                body: { invitationId: formValues.invitation_id },
            })
        } catch (_) {
            throw data("Invitation not found", 404)
        }
        return redirectWithSuccess(
            `/organization/${formValues.organization_slug}`,
            {
                message: "Uitnodiging geaccepteerd! 🎉",
            },
        )
    }

    if (formValues.intent === "reject") {
        try {
            await auth.api.rejectInvitation({
                headers: request.headers,
                body: { invitationId: formValues.invitation_id },
            })
        } catch (_) {
            throw data("Invitation not found", 404)
        }
        return redirectWithSuccess("/organization", {
            message: "Uitnodiging afgewezen",
        })
    }

    if (formValues.intent === "do_nothing") {
        return redirect("/organization/invitations")
    }

    throw new Error("invalid intent")
}

export function ErrorBoundary(props: Route.ErrorBoundaryProps) {
    const error = props.error
    if (isRouteErrorResponse(error)) {
        if (error.status === 404) {
            return (
                <div className="max-w-3xl mx-auto my-4 px-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Uitnodiging niet beschikbaar</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Separator />
                            <p className="my-1">
                                Helaas, deze uitnodiging is niet langer geldig
                                of bestaat niet. Neem eventueel contact op met
                                degene die je heeft uitgenodigd voor een nieuwe
                                uitnodiging.
                            </p>
                        </CardContent>
                        <CardFooter>
                            <form method="post" className="flex flex-row gap-2">
                                <input
                                    type="hidden"
                                    name="invitation_id"
                                    value={props.params.invitation_id}
                                />
                                <Button
                                    variant="secondary"
                                    name="intent"
                                    value="do_nothing"
                                >
                                    Terug naar mijn uitnodigingen
                                </Button>
                            </form>
                        </CardFooter>
                    </Card>
                </div>
            )
        }
    }

    throw error
}

function failBadRequest(message: string) {
    // Not 400 because 400 currently hits the Not Found error page
    return fail(message, 500)
}

function fail(message: string, status: number) {
    return data(message, { statusText: message, status: status })
}
