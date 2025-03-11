import type { EntryContext } from "react-router"

type CacheControl = {
    maxAge: number
    staleWhileRevalidate?: number
    isPublic?: boolean
    mustRevalidate?: boolean
    noStore?: boolean
}

/**
 * Generate Cache-Control header value based on provided options
 */
function generateCacheControl({
    maxAge,
    staleWhileRevalidate,
    isPublic = true,
    mustRevalidate = false,
    noStore = false,
}: CacheControl): string {
    const directives: string[] = []

    if (noStore) {
        return "no-store, no-cache, must-revalidate"
    }

    directives.push(isPublic ? "public" : "private")
    directives.push(`max-age=${maxAge}`)

    if (staleWhileRevalidate) {
        directives.push(`stale-while-revalidate=${staleWhileRevalidate}`)
    }

    if (mustRevalidate) {
        directives.push("must-revalidate")
    }

    return directives.join(", ")
}

/**
 * Get cache control headers based on the request path and context
 */
export function getCacheControlHeaders(
    request: Request,
    context: EntryContext,
): Headers {
    const url = new URL(request.url)
    const headers = new Headers()

    // Static assets (JS, CSS, images)
    if (url.pathname.match(/\.(js|css|png|jpg|jpeg|gif|ico|svg|woff2?)$/)) {
        headers.set(
            "Cache-Control",
            generateCacheControl({
                maxAge: 31536000, // 1 year
                staleWhileRevalidate: 86400, // 1 day
            }),
        )
        return headers
    }

    // API endpoints
    if (url.pathname.startsWith("/api")) {
        headers.set(
            "Cache-Control",
            generateCacheControl({
                maxAge: 0,
                noStore: true,
            }),
        )
        return headers
    }

    // Health check endpoint
    if (url.pathname === "/health") {
        headers.set(
            "Cache-Control",
            generateCacheControl({
                maxAge: 0,
                noStore: true,
            }),
        )
        return headers
    }

    // Dynamic routes (farm data, etc.)
    if (url.pathname.startsWith("/farm")) {
        headers.set(
            "Cache-Control",
            generateCacheControl({
                maxAge: 60, // 1 minute
                staleWhileRevalidate: 300, // 5 minutes
                mustRevalidate: true,
            }),
        )
        return headers
    }

    // Default for other routes
    headers.set(
        "Cache-Control",
        generateCacheControl({
            maxAge: 300, // 5 minutes
            staleWhileRevalidate: 3600, // 1 hour
        }),
    )
    return headers
}

/**
 * Add security headers to the response
 */
export function addSecurityHeaders(headers: Headers): Headers {
    headers.set(
        "Content-Security-Policy",
        "default-src 'self'; " +
            "script-src 'self' 'unsafe-inline' 'unsafe-eval'; " +
            "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
            "font-src 'self' https://fonts.gstatic.com; " +
            "img-src 'self' data: https://*.mapbox.com https://*.public.blob.vercel-storage.com; " +
            "connect-src 'self' https://*.mapbox.com https://sentry.io https://*.sentry.io https://*.nmi-agro.nl",
    )
    headers.set("X-Content-Type-Options", "nosniff")
    headers.set("X-Frame-Options", "DENY")
    headers.set("X-XSS-Protection", "1; mode=block")
    headers.set(
        "Strict-Transport-Security",
        "max-age=31536000; includeSubDomains",
    )
    headers.set("Referrer-Policy", "strict-origin-when-cross-origin")
    headers.set("Permissions-Policy", "geolocation=(self)")

    return headers
}
