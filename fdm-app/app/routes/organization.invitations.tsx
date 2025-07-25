import {
    acceptInvitation,
    getPendingInvitationsForUser,
    rejectInvitation,
} from "@svenvw/fdm-core"
import { formatDistanceToNow } from "date-fns"
import { nl } from "date-fns/locale"
import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router"
import { NavLink, useLoaderData } from "react-router-dom"
import { redirectWithSuccess } from "remix-toast"
import { z } from "zod"
import { FarmTitle } from "~/components/blocks/farm/farm-title"
import { Button } from "~/components/ui/button"
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "~/components/ui/card"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "~/components/ui/dialog"
import { getSession } from "~/lib/auth.server"
import { handleActionError, handleLoaderError } from "~/lib/error"
import { fdm } from "~/lib/fdm.server"
import { extractFormValuesFromRequest } from "~/lib/form"

// Define the type for a single invitation
type InvitationType = {
    invitation_id: string
    organization_name: string
    organization_slug: string
    inviter_firstname: string
    inviter_surname: string
    role: string
    expires_at: Date
}

export async function loader({ request }: LoaderFunctionArgs) {
    try {
        const session = await getSession(request)
        const invitations = await getPendingInvitationsForUser(
            fdm,
            session.user.id,
        )
        return { invitations }
    } catch (error) {
        throw handleLoaderError(error)
    }
}

export default function OrganizationsIndex() {
    const { invitations } = useLoaderData<{
        invitations: InvitationType[]
    }>()

    return (
        <main className="container">
            <div className="max-w-3xl mx-auto px-4">
                <div className="mb-8 flex items-center justify-between">
                    <FarmTitle
                        title={"Mijn uitnodigingen"}
                        description={
                            "Hier vind je een overzicht van alle uitnodigingen die je hebt ontvangen om lid te worden van een organisatie."
                        }
                    />
                </div>

                {invitations.length === 0 ? (
                    <div className="mx-auto flex h-full w-full items-center flex-col justify-center space-y-6 sm:w-[350px]">
                        <div className="flex flex-col space-y-2 text-center">
                            <h1 className="text-2xl font-semibold tracking-tight">
                                Je hebt op dit moment geen uitnodigingen open
                                staan
                            </h1>
                            <p className="text-sm text-muted-foreground">
                                Vraag bij je contactpersoon om een uitnodiging
                                als je bij een organisatie wil.
                            </p>
                        </div>
                        <Button asChild>
                            <NavLink to="/organization">
                                Terug naar organisaties
                            </NavLink>
                        </Button>
                    </div>
                ) : (
                    <div className="grid gap-4 grid-cols-1">
                        {invitations.map((invitation) => (
                            <Card key={invitation.invitation_id}>
                                <CardHeader>
                                    <CardTitle>
                                        {invitation.organization_name}
                                    </CardTitle>
                                    <CardDescription>
                                        Uitgenodigd door{" "}
                                        {invitation.inviter_firstname}{" "}
                                        {invitation.inviter_surname}
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-lg leading-none">
                                        Je bent uitgenodigd als{" "}
                                        <i className="font-semibold">
                                            {invitation.role}
                                        </i>
                                    </p>
                                    <br />
                                    <p className="text-sm text-muted-foreground mt-2">
                                        Verloopt{" "}
                                        {formatDistanceToNow(
                                            invitation.expires_at,
                                            {
                                                addSuffix: true,
                                                locale: nl,
                                            },
                                        )}
                                    </p>
                                </CardContent>
                                <CardFooter className="flex justify-between">
                                    <Button asChild variant="outline" size="sm">
                                        <NavLink
                                            to={`/organization/${invitation.organization_slug}`}
                                        >
                                            Meer info
                                        </NavLink>
                                    </Button>
                                    <div className="flex gap-2">
                                        <form method="post">
                                            <input
                                                type="hidden"
                                                name="invitation_id"
                                                value={invitation.invitation_id}
                                            />
                                            <Button
                                                name="intent"
                                                value="accept"
                                                size="sm"
                                            >
                                                Accepteren
                                            </Button>
                                        </form>
                                        <Dialog>
                                            <DialogTrigger asChild>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                >
                                                    Afwijzen
                                                </Button>
                                            </DialogTrigger>
                                            <DialogContent>
                                                <DialogHeader>
                                                    <DialogTitle>
                                                        Uitnodiging afwijzen
                                                    </DialogTitle>
                                                    <DialogDescription>
                                                        Weet je zeker dat je de
                                                        uitnodiging van{" "}
                                                        {
                                                            invitation.organization_name
                                                        }{" "}
                                                        wilt afwijzen?
                                                    </DialogDescription>
                                                </DialogHeader>
                                                <DialogFooter>
                                                    <form method="post">
                                                        <input
                                                            type="hidden"
                                                            name="invitation_id"
                                                            value={
                                                                invitation.invitation_id
                                                            }
                                                        />
                                                        <Button
                                                            variant="default"
                                                            name="intent"
                                                            value="reject"
                                                            size="sm"
                                                        >
                                                            Ja, afwijzen
                                                        </Button>
                                                    </form>
                                                </DialogFooter>
                                            </DialogContent>
                                        </Dialog>
                                    </div>
                                </CardFooter>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </main>
    )
}

const FormSchema = z.object({
    invitation_id: z.string(),
    intent: z.enum(["accept", "reject"]),
})

export async function action({ request }: ActionFunctionArgs) {
    try {
        const formValues = await extractFormValuesFromRequest(
            request,
            FormSchema,
        )

        const session = await getSession(request)

        if (formValues.intent === "accept") {
            await acceptInvitation(
                fdm,
                formValues.invitation_id,
                session.user.id,
            )
            return redirectWithSuccess("/organization", {
                message: "Uitnodiging geaccepteerd! 🎉",
            })
        }
        if (formValues.intent === "reject") {
            await rejectInvitation(
                fdm,
                formValues.invitation_id,
                session.user.id,
            )
            return redirectWithSuccess("/organization", {
                message: "Uitnodiging afgewezen",
            })
        }
        throw new Error("invalid intent")
    } catch (error) {
        throw handleActionError(error)
    }
}
