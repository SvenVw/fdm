/**
 * @file This file serves as the server-side entry point for the Remix application.
 *
 * It is responsible for handling incoming HTTP requests and generating the initial HTML response.
 * Key responsibilities include:
 * 1.  **Server-Side Rendering (SSR)**: It uses React's `renderToPipeableStream` to render the
 *     application into a stream, allowing for fast time-to-first-byte (TTFB) and progressive
 *     HTML rendering.
 * 2.  **Bot vs. Browser Handling**: It differentiates between requests from bots (e.g., search engine
 *     crawlers) and regular users. Bot requests wait for `onAllReady` to ensure the full HTML is sent,
 *     which is better for SEO. Browser requests use `onShellReady` to stream the response as soon as
 *     the main app "shell" is ready, improving perceived performance.
 * 3.  **Header Management**: It adds crucial security headers (e.g., CSP, X-Frame-Options) and
 *     sets appropriate `Cache-Control` headers for effective browser and CDN caching.
 * 4.  **Domain Redirection**: It includes logic to perform a 301 redirect from subdomains (like `www`)
 *     to the root domain to ensure a canonical URL.
 * 5.  **Error Handling and Monitoring**: The main request handler is wrapped with Sentry to capture
 *     server-side errors. A global `handleError` function is also exported to catch and report
 *     unhandled exceptions during the rendering process.
 *
 * @see https://remix.run/file-conventions/entry.server
 * @packageDocumentation
 */
import { PassThrough } from "node:stream"
import { createReadableStreamFromReadable } from "@react-router/node"
import * as Sentry from "@sentry/react-router"
import {
    getMetaTagTransformer,
    wrapSentryHandleRequest,
} from "@sentry/react-router"
import { isbot } from "isbot"
import { renderToPipeableStream } from "react-dom/server"
import type {
    AppLoadContext,
    EntryContext,
    HandleErrorFunction,
} from "react-router"
import { ServerRouter } from "react-router"
import { addSecurityHeaders, getCacheControlHeaders } from "./lib/cache.server"

export const streamTimeout = 30000

const handleRequest = async function handleRequest(
    request: Request,
    responseStatusCode: number,
    responseHeaders: Headers,
    reactRouterContext: EntryContext,
    _loadContext: AppLoadContext,
): Promise<Response> {
    const url = new URL(request.url)
    const { hostname } = url

    // Redirect subdomains (like www) to the root domain for canonical URLs.
    if (!hostname.startsWith("dev.")) {
        const parts = hostname.split(".")
        if (parts.length > 2) {
            const rootDomain = parts.slice(-2).join(".")
            url.hostname = rootDomain
            return new Response(null, {
                status: 301,
                headers: {
                    Location: url.toString(),
                },
            })
        }
    }

    // Apply cache control headers based on the route and request.
    const cacheHeaders = getCacheControlHeaders(request, reactRouterContext)
    cacheHeaders.forEach((value, key) => {
        responseHeaders.set(key, value)
    })

    // Apply security-related HTTP headers.
    addSecurityHeaders(responseHeaders)

    // Differentiate handling based on the user agent.
    return isbot(request.headers.get("user-agent") || "")
        ? handleBotRequest(
              request,
              responseStatusCode,
              responseHeaders,
              reactRouterContext,
          )
        : handleBrowserRequest(
              request,
              responseStatusCode,
              responseHeaders,
              reactRouterContext,
          )
}

/**
 * Handles server-side rendering for bot user agents.
 * It waits for the entire page to be ready (`onAllReady`) before sending the response
 * to ensure search engines receive complete content.
 * @internal
 */
function handleBotRequest(
    request: Request,
    responseStatusCode: number,
    responseHeaders: Headers,
    reactRouterContext: EntryContext,
): Promise<Response> {
    return new Promise((resolve, reject) => {
        let shellRendered = false
        let currentStatus = responseStatusCode
        const { pipe, abort } = renderToPipeableStream(
            <ServerRouter context={reactRouterContext} url={request.url} />,
            {
                onAllReady() {
                    shellRendered = true
                    const body = new PassThrough()
                    const stream = createReadableStreamFromReadable(body)

                    responseHeaders.set("Content-Type", "text/html")
                    responseHeaders.set("Vary", "User-Agent")

                    resolve(
                        new Response(stream, {
                            headers: responseHeaders,
                            status: currentStatus,
                        }),
                    )

                    pipe(body)
                },
                onShellError(error: unknown) {
                    reject(error)
                },
                onError(error: unknown) {
                    currentStatus = 500
                    if (shellRendered) {
                        console.error(error)
                    }
                },
            },
        )

        setTimeout(abort, streamTimeout + 1000)
    })
}

/**
 * Handles server-side rendering for regular browser user agents.
 * It streams the response as soon as the app shell is ready (`onShellReady`)
 * to improve perceived loading performance.
 * @internal
 */
function handleBrowserRequest(
    request: Request,
    responseStatusCode: number,
    responseHeaders: Headers,
    reactRouterContext: EntryContext,
): Promise<Response> {
    return new Promise((resolve, reject) => {
        let shellRendered = false
        let currentStatus = responseStatusCode
        const { pipe, abort } = renderToPipeableStream(
            <ServerRouter context={reactRouterContext} url={request.url} />,
            {
                onShellReady() {
                    shellRendered = true
                    const body = new PassThrough()
                    const stream = createReadableStreamFromReadable(body)

                    responseHeaders.set("Content-Type", "text/html")
                    responseHeaders.set("Vary", "User-Agent")

                    resolve(
                        new Response(stream, {
                            headers: responseHeaders,
                            status: currentStatus,
                        }),
                    )

                    // This enables distributed tracing between client and server for Sentry.
                    pipe(getMetaTagTransformer(body))
                },
                onShellError(error: unknown) {
                    reject(error)
                },
                onError(error: unknown) {
                    currentStatus = 500
                    if (shellRendered) {
                        console.error(error)
                    }
                },
            },
        )

        setTimeout(abort, streamTimeout + 1000)
    })
}

// Wrap the main request handler with Sentry for error monitoring.
export default wrapSentryHandleRequest(handleRequest)

/**
 * A global error handler for the Remix server.
 * It captures unhandled exceptions with Sentry, ensuring they are reported.
 */
export const handleError: HandleErrorFunction = (error, { request }) => {
    // React Router may abort some interrupted requests; we don't need to report those.
    if (!request.signal.aborted) {
        Sentry.captureException(error)
        console.error(error)
    }
}
