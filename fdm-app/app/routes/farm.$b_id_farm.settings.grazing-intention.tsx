import { getGrazingIntentions, setGrazingIntention } from "@svenvw/fdm-core"
import {
    type ActionFunctionArgs,
    type LoaderFunctionArgs,
    useFetcher,
    useLoaderData,
} from "react-router"
import { dataWithError, dataWithSuccess } from "remix-toast"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "~/components/ui/card"
import { Switch } from "~/components/ui/switch"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "~/components/ui/table"
import { getSession } from "~/lib/auth.server"
import { getCalendarSelection } from "~/lib/calendar"
import { handleActionError, handleLoaderError } from "~/lib/error"
import { fdm } from "~/lib/fdm.server"

export async function loader({ request, params }: LoaderFunctionArgs) {
    try {
        const b_id_farm = params.b_id_farm
        if (!b_id_farm) {
            throw new Error("invalid: b_id_farm")
        }
        const session = await getSession(request)
        const grazingIntentions = await getGrazingIntentions(
            fdm,
            session.principal_id,
            b_id_farm,
        )
        return { b_id_farm, grazingIntentions }
    } catch (error) {
        throw handleLoaderError(error)
    }
}

export async function action({ request, params }: ActionFunctionArgs) {
    try {
        const b_id_farm = params.b_id_farm
        if (!b_id_farm) {
            throw new Error("invalid: b_id_farm")
        }
        const session = await getSession(request)
        const formData = await request.formData()
        const year = Number(formData.get("year"))
        const hasGrazingIntention =
            formData.get("hasGrazingIntention") === "true"
        if (Number.isNaN(year)) {
            throw new Error("invalid: year")
        }

        await setGrazingIntention(
            fdm,
            session.principal_id,
            b_id_farm,
            year,
            !hasGrazingIntention,
        )

        if (hasGrazingIntention) {
            return dataWithSuccess({}, `Beweiding voor ${year} uitgeschakeld.`)
        }
        return dataWithSuccess({}, `Beweiding voor ${year} ingeschakeld.`)
    } catch (error) {
        throw handleActionError(error)
    }
}

export default function GrazingIntentionSettings() {
    const { grazingIntentions } = useLoaderData<typeof loader>()
    const fetcher = useFetcher<typeof action>()

    const years = getCalendarSelection()
        .map((year) => Number(year))
        .filter((year) => year >= 2006 && year <= 2025)

    return (
        <div className="flex justify-center p-4">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle>Beweiding</CardTitle>
                    <CardDescription>
                        Geef hier aan of je voor een bepaald jaar hebt beweid of
                        van plan bent te gaan beweiden. Dit heeft invloed op de
                        berekeningen.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Table className="w-fit">
                        <TableHeader>
                            <TableRow>
                                <TableHead>Jaar</TableHead>
                                <TableHead>Beweiding</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {years.map((year) => {
                                const hasGrazingIntention =
                                    grazingIntentions.some(
                                        (g) =>
                                            g.b_grazing_intention_year ===
                                                year && g.b_grazing_intention,
                                    )
                                return (
                                    <TableRow key={year}>
                                        <TableCell>{year}</TableCell>
                                        <TableCell>
                                            <fetcher.Form method="post">
                                                <Switch
                                                    checked={
                                                        hasGrazingIntention
                                                    }
                                                    onCheckedChange={() => {
                                                        fetcher.submit(
                                                            {
                                                                year: String(
                                                                    year,
                                                                ),
                                                                hasGrazingIntention:
                                                                    String(
                                                                        hasGrazingIntention,
                                                                    ),
                                                            },
                                                            { method: "post" },
                                                        )
                                                    }}
                                                />
                                            </fetcher.Form>
                                        </TableCell>
                                    </TableRow>
                                )
                            })}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    )
}
