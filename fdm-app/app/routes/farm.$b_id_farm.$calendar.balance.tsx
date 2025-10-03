import { redirect } from "react-router"
import type { CacheStore, DataWithInputHash } from "../store/calculation-cache"
import {
    useFarmNitrogenBalanceCache,
    useFieldNitrogenBalanceCache,
} from "../store/calculation-cache"
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

/**
 * Client middleware that redirects with the most recent cacheHash, obtained from the provided cache store, when the route matches the provided matcher, if needed.
 *
 * @param matcherProvider function that return a regexp that matches url strings like `/farm/b_id_farm/calendar/balance/nitrogen`
 * @param storeProvider cache store to use for this match
 * @param getId function to oobtain the id out of the client middleware function args
 */
function balanceCacheMiddleware<T extends DataWithInputHash>(
    matcherProvider: () => RegExp,
    storeProvider: () => CacheStore<T>,
    getId: (args: Parameters<Route.ClientMiddlewareFunction>[0]) => string,
): Route.ClientMiddlewareFunction {
    return (args, next) => {
        const { request } = args
        if (typeof window === "undefined") return next()

        const requestUrl = new URL(request.url)
        if (!matcherProvider().test(requestUrl.pathname)) return next()

        const previousCacheHash = requestUrl.searchParams.get("cacheHash")
        let newCacheHash: string | null = previousCacheHash

        // Get cache hash for the cache we (possibly) have
        const cachedData = storeProvider().get(getId(args))
        if (cachedData?.inputHash) {
            newCacheHash = cachedData.inputHash
        } else {
            newCacheHash = null
        }

        // Redirect if the `cacheHash` search param was wrong
        if (previousCacheHash !== newCacheHash) {
            newCacheHash
                ? requestUrl.searchParams.set("cacheHash", newCacheHash)
                : requestUrl.searchParams.delete("cacheHash")
            throw redirect(requestUrl.toString())
        }

        return next()
    }
}

export const clientMiddleware = [
    // Redirect to nitrogen balance if what kind of balance analysis needed is not known yet
    redirectMiddleware,
    // Farm nitrogen
    balanceCacheMiddleware(
        () => /\/nitrogen\/?$/,
        () => useFarmNitrogenBalanceCache.getState(),
        ({ params }) => params.b_id_farm,
    ),
    // Field nitrogen
    balanceCacheMiddleware(
        () => /\/nitrogen\/.+\/?$/,
        () => useFieldNitrogenBalanceCache.getState(),
        ({ params }) => params.b_id || "",
    ),
]
