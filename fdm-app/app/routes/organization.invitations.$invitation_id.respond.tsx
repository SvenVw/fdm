/**
 * @file This file handles the response to an organization invitation.
 * It allows a user to accept or reject an invitation to join an organization.
 * @copyright 2023 Batavi
 * @license MIT
 */
import {
    acceptInvitation,
    getPendingInvitation,
    rejectInvitation,
} from "@svenvw/fdm-core"
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
import { getSession } from "~/lib/auth.server"
import { fdm } from "~/lib/fdm.server"
import { extractFormValuesFromRequest } from "~/lib/form"
import type { Route } from "../+types/root"

/**
 * Loads the data for the invitation response page.
 *
 * This function validates the invitation ID and fetches the details of the
 * pending invitation. It ensures the user is authenticated before proceeding.
 *
 * @param request - The incoming request object.
 * @param params - The route parameters, containing the invitation ID.
 * @returns An object with the invitation details.
 * @throws {Response} A 404 response if the invitation is not found, or a 500 response for a bad request.
 */
export async function loader({ request, params }: LoaderFunctionArgs) {
    await getSession(request)

    // Check for valid invitation id
    if (!params.invitation_id) {
        throw failBadRequest("Bad Request: invitation id missing")
    }

    // Check for valid invitation
    try {
        const invitation = await getPendingInvitation(fdm, params.invitation_id)

        return {
            invitationId: invitation.invitation_id,
            inviterFirstName: invitation.inviter_firstname,
            inviterSurname: invitation.inviter_surname,
            organizationSlug: invitation.organization_slug,
            organizationName: invitation.organization_name,
            role: invitation.role,
        }
    } catch (_e) {
        throw data("Invitation not found", 404)
    }
}

/**
 * Renders the page for responding to an organization invitation.
 *
 * This component handles the user interface for accepting or rejecting an invitation.
 * It reads an `intent` from the URL search parameters to determine the initial action.
 * If the intent is 'accept', it automatically submits a form to accept the invitation.
 * If the intent is 'reject', it displays a confirmation dialog to the user.
 *
 * @returns The JSX for the invitation response page.
 * @throws {Response} A bad request response if the intent is invalid.
 */
export default function Respond() {
    const {
        invitationId,
        inviterFirstName,
        inviterSurname,
        organizationSlug,
        organizationName,
        role,
    } = useLoaderData()

    const [searchParams] = useSearchParams()
    const intentRaw = searchParams.get("intent")
    const intent = intentRaw != null ? intentRaw.toLowerCase() : null

    const submit = useSubmit()

    useEffect(() => {
        if (intent && intent === "accept") {
            submit(
                {
                    invitation_id: invitationId,
                    intent: "accept",
                    organization_slug: organizationSlug,
                },
                { method: "POST" },
            )
        }
    }, [intent, submit, invitationId, organizationSlug])

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

/**
 * Handles the form submission for accepting or rejecting an invitation.
 *
 * This function processes the user's response to an invitation. It can accept,
 * reject, or take no action based on the 'intent' value in the form data.
 * On success, it redirects the user to the appropriate page with a toast message.
 *
 * @param request - The incoming request object containing the form data.
 * @returns A redirect response.
 * @throws {Response} A 404 response if the invitation is not found.
 * @throws {Error} If the intent is invalid.
 */
export async function action({ request }: ActionFunctionArgs) {
    const formValues = await extractFormValuesFromRequest(request, FormSchema)

    const session = await getSession(request)

    if (formValues.intent === "accept") {
        try {
            await acceptInvitation(
                fdm,
                formValues.invitation_id,
                session.user.id,
            )
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
            await rejectInvitation(
                fdm,
                formValues.invitation_id,
                session.user.id,
            )
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

/**
 * Renders a user-friendly error boundary for this route.
 *
 * This component catches errors thrown during rendering, loading, or actions
 * on this route. It provides a specific message for 404 errors, indicating
 * that the invitation is not available.
 *
 * @param props - The props object containing the error and route parameters.
 * @returns The JSX for the error boundary.
 * @throws The original error if it's not a 404 response.
 */
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
