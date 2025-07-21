import { listDerogations, addDerogation, removeDerogation } from "@svenvw/fdm-core";
import { type ActionFunctionArgs, type LoaderFunctionArgs, useLoaderData, useFetcher } from "react-router";
import { dataWithError, dataWithSuccess } from "remix-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Switch } from "~/components/ui/switch";
import { getSession } from "~/lib/auth.server";
import { fdm } from "~/lib/fdm.server";
import { handleActionError, handleLoaderError } from "~/lib/error";
import { getCalendarSelection } from "~/lib/calendar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "~/components/ui/table";

export async function loader({ request, params }: LoaderFunctionArgs) {
    try {
        const b_id_farm = params.b_id_farm!;
        const session = await getSession(request);
        const derogations = await listDerogations(fdm, session.principal_id, b_id_farm);
        return { b_id_farm, derogations };
    } catch (error) {
        throw handleLoaderError(error);
    }
}

export async function action({ request, params }: ActionFunctionArgs) {
    try {
        const b_id_farm = params.b_id_farm!;
        const session = await getSession(request);
        const formData = await request.formData();
        const year = Number(formData.get("year"));
        const hasDerogation = formData.get("hasDerogation") === "true";

        if (hasDerogation) {
            const derogations = await listDerogations(fdm, session.principal_id, b_id_farm);
            const derogation = derogations.find(d => d.b_derogation_year === year);
            if (derogation) {
                await removeDerogation(fdm, session.principal_id, derogation.b_id_derogation);
                return dataWithSuccess({}, `Derogatie voor ${year} verwijderd.`);
            }
        } else {
            await addDerogation(fdm, session.principal_id, b_id_farm, year);
            return dataWithSuccess({}, `Derogatie voor ${year} toegevoegd.`);
        }

        return dataWithError({}, "Actie mislukt.");
    } catch (error) {
        throw handleActionError(error);
    }
}

export default function DerogationSettings() {
    const { derogations } = useLoaderData<typeof loader>();
    const fetcher = useFetcher<typeof action>();

    const years = getCalendarSelection()
        .map(year => Number(year))
        .filter(year => year >= 2006 && year <= 2025);

    return (
        <div className="flex flex-col space-y-4 justify-self-center">
        <Card className="w-[350px]">
            <CardHeader>
                <CardTitle>Derogatie</CardTitle>
                <CardDescription>
                    Schakel derogatie in voor de jaren waarvoor dit bedrijf in aanmerking komt. Dit heeft invloed op de berekening van je gebruiksruimte.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Table className="w-fit">
                    <TableHeader>
                        <TableRow>
                            <TableHead>Jaar</TableHead>
                            <TableHead>Derogatie</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {years.map((year) => {
                            const hasDerogation = derogations.some(d => d.b_derogation_year === year);
                            return (
                                <TableRow key={year}>
                                    <TableCell>{year}</TableCell>
                                    <TableCell>
                                        <fetcher.Form method="post">
                                            <input type="hidden" name="year" value={year} />
                                            <input type="hidden" name="hasDerogation" value={String(hasDerogation)} />
                                            <Switch
                                                checked={hasDerogation}
                                                onCheckedChange={() => {
                                                    fetcher.submit({ year: String(year), hasDerogation: String(hasDerogation) }, { method: "post" });
                                                }}
                                            />
                                        </fetcher.Form>
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
        </div>
    );
}