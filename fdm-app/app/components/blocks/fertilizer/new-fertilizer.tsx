import type { Fertilizer } from "@svenvw/fdm-core"
import { Link, NavLink, useSearchParams } from "react-router"
import { Card, CardContent } from "~/components/ui/card"

export function CustomFertilizerButton() {
    const [searchParams] = useSearchParams()
    return (
        <Link
            to={
                searchParams.has("fieldIds")
                    ? `custom?fieldIds=${searchParams.get("fieldIds")}`
                    : "custom"
            }
            className="block"
        >
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
    )
}

export function BasedOffFertilizerButton({
    fertilizer,
}: {
    fertilizer: Fertilizer
}) {
    const [searchParams] = useSearchParams()
    return (
        <NavLink
            to={
                searchParams.has("fieldIds")
                    ? `${fertilizer.p_id}?fieldIds=${searchParams.get("fieldIds")}`
                    : `${fertilizer.p_id}`
            }
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
    )
}
