import {
    addHarvest,
    getCultivation,
} from "@svenvw/fdm-core"
import {
    type ActionFunctionArgs,
    data,
    type LoaderFunctionArgs,
    type MetaFunction,
    Outlet,
    useNavigate,
} from "react-router"
import { redirectWithSuccess } from "remix-toast"
import { FormSchema } from "~/components/blocks/harvest/schema"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "~/components/ui/dialog"
import { getSession } from "~/lib/auth.server"
import { clientConfig } from "~/lib/config"
import { handleActionError, handleLoaderError } from "~/lib/error"
import { fdm } from "~/lib/fdm.server"
import { extractFormValuesFromRequest } from "~/lib/form"

// Meta
export const meta: MetaFunction = () => {
    return [
        { title: `Oogst toevoegen - Gewas | ${clientConfig.name}` },
        {
            name: "description",
            content: "Voeg een oogst toe aan dit gewas.",
        },
    ]
}

export async function loader({ request, params }: LoaderFunctionArgs) {
    try {
        const b_id_farm = params.b_id_farm
        if (!b_id_farm) {
            throw data("Farm ID is required", { status: 400 })
        }

        const b_lu = params.b_lu
        if (!b_lu) {
            throw data("Cultivation ID is required", { status: 400 })
        }

        const session = await getSession(request)
        const cultivation = await getCultivation(
            fdm,
            session.principal_id,
            b_lu,
        )
        if (!cultivation) {
            throw data("Cultivation not found", { status: 404 })
        }

        return {
            b_id_farm,
            b_lu,
        }
    } catch (error) {
        throw handleLoaderError(error)
    }
}

export default function AddHarvestRoute() {
    const navigate = useNavigate()

    return (
        <Dialog open={true} onOpenChange={() => navigate("..")}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Oogst</DialogTitle>
                </DialogHeader>
                <Outlet />
            </DialogContent>
        </Dialog>
    )
}

export async function action({ request, params }: ActionFunctionArgs) {
    try {
        const b_lu = params.b_lu
        if (!b_lu) {
            throw data("Cultivation ID is required", { status: 400 })
        }

        const session = await getSession(request)
        const formValues = await extractFormValuesFromRequest(
            request,
            FormSchema,
        )

        await addHarvest(
            fdm,
            session.principal_id,
            b_lu,
            formValues.b_lu_harvest_date,
            formValues.b_lu_yield,
            formValues.b_lu_n_harvestable,
        )

        return redirectWithSuccess("..", {
            message: "Oogst succesvol toegevoegd! 🎉",
        })
    } catch (error) {
        throw handleActionError(error)
    }
}
