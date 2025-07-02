import {
    getFarm,
    grantRoleToFarm,
    isAllowedToShareFarm,
    listPrincipalsForFarm,
    revokePrincipalFromFarm,
    updateRoleOfPrincipalAtFarm,
} from "@svenvw/fdm-core"
import {
    type ActionFunctionArgs,
    data,
    type LoaderFunctionArgs,
    type MetaFunction,
    useLoaderData,
} from "react-router"
import { dataWithError, dataWithSuccess } from "remix-toast"
import { AccessInfoCard } from "~/components/blocks/access/access-info-card"
import { AccessManagementCard } from "~/components/blocks/access/access-management-card"
import { getSession } from "~/lib/auth.server"
import { clientConfig } from "~/lib/config"
import { handleActionError, handleLoaderError } from "~/lib/error"
import { fdm } from "~/lib/fdm.server"
import { extractFormValuesFromRequest } from "~/lib/form"
import { AccessFormSchema } from "~/lib/schemas/access.schema"

// Meta
export const meta: MetaFunction = () => {
    return [
        { title: `Toegang - Instellingen - Bedrijf | ${clientConfig.name}` },
        {
            name: "description",
            content: "Bekijk en bewerk de toegang tot je bedrijf.",
        },
    ]
}

export async function loader({ request, params }: LoaderFunctionArgs) {
    try {
        // Get the farm id
        const b_id_farm = params.b_id_farm
        if (!b_id_farm) {
            throw data("Farm ID is required", {
                status: 400,
                statusText: "Farm ID is required",
            })
        }

        // Get the session
        const session = await getSession(request)

        // Get the farm details ( to check if has access to farm)
        const farm = await getFarm(fdm, session.principal_id, b_id_farm)
        if (!farm) {
            throw data("Farm is not found", {
                status: 404,
                statusText: "Farm is not found",
            })
        }

        // Get principals with access to this farm
        const principals = await listPrincipalsForFarm(
            fdm,
            session.principal_id,
            b_id_farm,
        )

        // Check if user has share permission
        const hasSharePermission = await isAllowedToShareFarm(
            fdm,
            session.principal_id,
            b_id_farm,
        )

        // Return user information from loader
        return {
            b_id_farm: b_id_farm,
            principals: principals,
            hasSharePermission: hasSharePermission,
        }
    } catch (error) {
        throw handleLoaderError(error)
    }
}

export default function FarmSettingsAccessBlock() {
    const { principals, hasSharePermission } = useLoaderData<typeof loader>()

    return (
        <div className="grid md:grid-cols-3 gap-4">
            <AccessManagementCard
                principals={principals}
                hasSharePermission={hasSharePermission}
            />
            <AccessInfoCard />
        </div>
    )
}

export async function action({ request, params }: ActionFunctionArgs) {
    try {
        const b_id_farm = params.b_id_farm
        if (!b_id_farm) {
            throw new Error("missing: b_id_farm")
        }
        const formValues = await extractFormValuesFromRequest(
            request,
            AccessFormSchema,
        )

        const session = await getSession(request)

        if (formValues.intent === "invite_user") {
            if (!formValues.username) {
                return dataWithError(
                    null,
                    "Vul een gebruikers- of organisatienaam in om uit te nodigen",
                )
            }
            if (!formValues.role) {
                return handleActionError("missing: role")
            }
            await grantRoleToFarm(
                fdm,
                session.user.id,
                formValues.username,
                b_id_farm,
                formValues.role,
            )

            return dataWithSuccess(null, {
                message: `${formValues.username} is uitgenodigd! 🎉`,
            })
        }

        if (formValues.intent === "update_role") {
            if (!formValues.username) {
                return handleActionError("missing: username")
            }
            if (!formValues.role) {
                return handleActionError("missing: role")
            }
            await updateRoleOfPrincipalAtFarm(
                fdm,
                session.user.id,
                formValues.username,
                b_id_farm,
                formValues.role,
            )
            return dataWithSuccess(null, {
                message: "Rol is bijgewerkt! 🎉",
            })
        }

        if (formValues.intent === "remove_user") {
            if (!formValues.username) {
                return handleActionError("missing: username")
            }
            await revokePrincipalFromFarm(
                fdm,
                session.user.id,
                formValues.username,
                b_id_farm,
            )
            return dataWithSuccess(null, {
                message: `Gebruiker ${formValues.username} is verwijderd`,
            })
        }
        throw new Error("invalid intent")
    } catch (error) {
        console.error(error)
        return dataWithError(null, "Er is iets misgegaan")
        // throw handleActionError(error)
    }
}
