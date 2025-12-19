import type { ActionFunction, LoaderFunction } from "react-router"
import { serverConfig } from "~/lib/config.server"

const MAX_BODY_SIZE = 10 * 1024 * 1024 // 10MB limit

const posthogProxy = async (request: Request) => {
    
    if (!serverConfig.analytics.posthog) {
        return new Response(null, { status: 204 })
    }

    // Validate request size
    const contentLength = request.headers.get('content-length')
    if (contentLength && parseInt(contentLength, 10) > MAX_BODY_SIZE) {
        return new Response('Request too large', { status: 413 })
    }

    const API_HOST = serverConfig.analytics.posthog.host.replace("https://", "")
    const ASSET_HOST = API_HOST?.replace(/^([a-z]{2})\./, "$1-assets.")

    const url = new URL(request.url)
    const hostname = url.pathname.startsWith("/ph/static/")
        ? ASSET_HOST
        : API_HOST

    const newUrl = new URL(url)
    newUrl.protocol = "https"
    newUrl.hostname = hostname
    newUrl.port = "443"
    newUrl.pathname = newUrl.pathname.replace(/^\/ph/, "")

    const headers = new Headers(request.headers)
    headers.set("host", hostname)
    headers.delete("accept-encoding")

    let response: Response
    try {
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 30000) // 30s timeout
        
        response = await fetch(newUrl, {
            method: request.method,
            headers,
            body: request.body,
            signal: controller.signal,
            // @ts-ignore - duplex is required for streaming request bodies
            duplex: 'half',
        })
        
        clearTimeout(timeoutId)
    } catch (error) {
        console.error('PostHog proxy error:', error)
        return new Response('Service unavailable', { 
            status: 503,
            statusText: 'PostHog proxy error'
        })
    }

    const responseHeaders = new Headers(response.headers)
    responseHeaders.delete("content-encoding")
    responseHeaders.delete("content-length")

    return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: responseHeaders,
    })
}

export const loader: LoaderFunction = async ({ request }) =>
  posthogProxy(request)

export const action: ActionFunction = async ({ request }) =>
  posthogProxy(request)