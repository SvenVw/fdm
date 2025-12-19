import type { ActionFunction, LoaderFunction } from "react-router"
import { serverConfig } from "~/lib/config.server"

const posthogProxy = async (request: Request) => {
    
    if (!serverConfig.analytics.posthog) {
        return new Response(null, { status: 204 })
    }

    const API_HOST = serverConfig.analytics.posthog.host.replace("https://", "")
    const ASSET_HOST = API_HOST?.replace("eu", "eu-assets")

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

    const response = await fetch(newUrl, {
        method: request.method,
        headers,
        body: request.body,
        // @ts-ignore - duplex is required for streaming request bodies
        duplex: 'half',
    })

    const responseHeaders = new Headers(response.headers)
    responseHeaders.delete("content-encoding")
    responseHeaders.delete("content-length")

    const data = await response.arrayBuffer()

    return new Response(data, {
        status: response.status,
        statusText: response.statusText,
        headers: responseHeaders,
    })
}

export const loader: LoaderFunction = async ({ request }) =>
  posthogProxy(request)

export const action: ActionFunction = async ({ request }) =>
  posthogProxy(request)