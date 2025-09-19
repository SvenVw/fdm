import type { Fertilizer } from "@svenvw/fdm-core"
import { Link, NavLink } from "react-router"
import { Card, CardContent } from "~/components/ui/card"

interface NewFertilizerIndexLoaderData {
    fertilizers: Fertilizer[]
}

export function NewFertilizerIndex({
    loaderData,
}: {
    loaderData: NewFertilizerIndexLoaderData
}) {
    const { fertilizers } = loaderData
    return (
        <div className="space-y-4">
            <Link to="custom" className="block">
                <Card>
                    <CardContent className="p-4">
                        <h2 className="text-xl font-semibold">
                            Maak een nieuwe meststof aan
                        </h2>
                        <p className="text-muted-foreground">
                            Begin met een leeg formulier
                        </p>
                    </CardContent>
                </Card>
            </Link>

            <h2 className="text-xl font-bold">Of baseer op een meststof</h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {fertilizers.map((fertilizer: Fertilizer) => (
                    <NavLink
                        key={fertilizer.p_id}
                        to={`${fertilizer.p_id}`}
                        className="block"
                    >
                        <Card>
                            <CardContent className="p-4">
                                <h3 className="text-lg font-semibold">
                                    {fertilizer.p_name_nl || "Onbekend"}
                                </h3>
                                {/* <p className="text-muted-foreground">
                                    {fertilizer.p_description ||
                                        "No description available."}
                                </p> */}
                            </CardContent>
                        </Card>
                    </NavLink>
                ))}
            </div>
        </div>
    )
}
