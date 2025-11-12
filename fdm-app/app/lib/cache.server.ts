/**
 * @file This module provides server-side utilities for managing HTTP caching and security headers.
 *
 * It contains functions to generate `Cache-Control` headers tailored to different types of
 * resources and to apply a strict Content Security Policy (CSP) and other security-related
 * headers to outgoing responses.
 *
 * @packageDocumentation
 */
import type { EntryContext } from "react-router"
import { clientConfig } from "~/lib/config"

type CacheControl = {
    maxAge: number
    staleWhileRevalidate?: number
    isPublic?: boolean
    mustRevalidate?: boolean
    noStore?: boolean
}

/**
 * Generates a `Cache-Control` header string based on the provided options.
 * @internal
 */
function generateCacheControl({
    maxAge,
    staleWhileRevalidate,
    isPublic = true,
    mustRevalidate = false,
    noStore = false,
}: CacheControl): string {
    if (noStore) {
        return "no-store, no-cache, must-revalidate"
    }
    const directives: string[] = [
        isPublic ? "public" : "private",
        `max-age=${maxAge}`,
    ]
    if (staleWhileRevalidate) {
        directives.push(`stale-while-revalidate=${staleWhileRevalidate}`)
    }
    if (mustRevalidate) {
        directives.push("must-revalidate")
    }
    return directives.join(", ")
}

/**
 * Determines the appropriate `Cache-Control` headers for a given request.
 *
 * This function applies different caching strategies based on the request URL path:
 * - **Static Assets**: Long cache duration (1 year).
 * - **API Routes & Health Checks**: No caching.
 * - **Dynamic Farm Data**: No caching for mutations; short revalidation for GET requests.
 * - **Other Routes**: Short cache duration with longer stale-while-revalidate.
 *
 * @param request - The incoming `Request` object.
 * @param _context - The Remix `EntryContext`.
 * @returns A `Headers` object with the appropriate `Cache-Control` directive set.
 */
export function getCacheControlHeaders(
    request: Request,
    _context: EntryContext,
): Headers {
    const url = new URL(request.url)
    const headers = new Headers()

    if (url.pathname.match(/\.(js|css|png|jpg|jpeg|gif|ico|svg|woff2?)$/)) {
        headers.set(
            "Cache-Control",
            generateCacheControl({
                maxAge: 31536000, // 1 year
                staleWhileRevalidate: 86400, // 1 day
            }),
        )
    } else if (url.pathname.startsWith("/api") || url.pathname === "/health") {
        headers.set("Cache-Control", generateCacheControl({ noStore: true }))
    } else if (url.pathname.startsWith("/farm")) {
        if (request.method !== "GET") {
            headers.set(
                "Cache-Control",
                generateCacheControl({ noStore: true }),
            )
        } else {
            headers.set(
                "Cache-Control",
                generateCacheControl({
                    maxAge: 0,
                    staleWhileRevalidate: 5,
                    mustRevalidate: true,
                }),
            )
        }
    } else {
        headers.set(
            "Cache-Control",
            generateCacheControl({
                maxAge: 300, // 5 minutes
                staleWhileRevalidate: 3600, // 1 hour
            }),
        )
    }
    return headers
}

/**
 * Adds a set of standard security headers to a `Headers` object.
 *
 * This function configures a strict Content Security Policy (CSP) to mitigate XSS attacks,
 * along with other important security headers like `X-Content-Type-Options`, `X-Frame-Options`,
 * `Strict-Transport-Security`, etc. The CSP includes a `report-uri` for Sentry if configured.
 *
 * @param headers - The `Headers` object to which the security headers will be added.
 * @returns The modified `Headers` object.
 */
export function addSecurityHeaders(headers: Headers): Headers {
    const reportUri = clientConfig.analytics?.sentry?.security_report_uri
        ? encodeURIComponent(
              clientConfig.analytics.sentry.security_report_uri.trim(),
          )
        : ""

    let csp = `default-src 'self';
        script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.mapbox.com https://*.posthog.com;
        worker-src 'self' blob:;
        style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://*.posthog.com;
        font-src 'self' https://fonts.gstatic.com https://*.posthog.com data:;
        img-src 'self' data: blob: https://*.mapbox.com https://*.public.blob.vercel-storage.com https://images.unsplash.com https://lh3.googleusercontent.com https://graph.microsoft.com https://*.posthog.com;
        connect-src 'self' https://*.mapbox.com https://sentry.io https://*.sentry.io https://*.nmi-agro.nl https://storage.googleapis.com/fdm-public-data/ https://*.posthog.com ws://localhost:* http://localhost:*;
        frame-src 'self';
        media-src 'self' https://*.posthog.com;
        object-src 'none';
        base-uri 'self';
        form-action 'self';
        frame-ancestors 'none';`

    if (reportUri) {
        csp += `report-uri ${reportUri};`
    }

    headers.set("Content-Security-Policy", csp.replace(/\s+/g, " ").trim())
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
