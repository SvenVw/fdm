import { redirect } from "react-router"
import { splatCacheMiddleware } from "~/lib/middleware"
import {
    useFarmNitrogenBalanceCache,
    useFieldNitrogenBalanceCache,
} from "~/store/calculation-cache"
import type { Route } from "./+types/farm.$b_id_farm.$calendar.balance"

// In case the user navigated directly by URL
export function loader({ params, request }: Route.LoaderArgs) {
    if (/\/balance\/?($|\?)/.test(request.url)) {
        throw redirect(
            `/farm/${params.b_id_farm}/${params.calendar}/balance/nitrogen`,
        )
    }

    return {}
}

// In case the user navigated within the application
const redirectMiddleware: Route.ClientMiddlewareFunction = (
    { request, params },
    next,
) => {
    if (/\/balance\/?($|\?)/.test(request.url)) {
        throw redirect(
            `/farm/${params.b_id_farm}/${params.calendar}/balance/nitrogen`,
        )
    }

    return next()
}

export const clientMiddleware = [
    // Redirect to nitrogen balance if what kind of balance analysis needed is not known yet
    redirectMiddleware,
    // Farm nitrogen
    splatCacheMiddleware(
        () => /\/nitrogen\/?$/,
        () => useFarmNitrogenBalanceCache.getState(),
        ({ params }) => params.b_id_farm || "",
    ),
    // Field nitrogen
    splatCacheMiddleware(
        () => /\/nitrogen\/.+\/?$/,
        () => useFieldNitrogenBalanceCache.getState(),
        ({ params }) => params.b_id || "",
    ),
]
