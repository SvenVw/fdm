import { RvoClient } from "@nmi-agro/rvo-connector"

export const createRvoClient = (
    clientId: string,
    clientName: string,
    redirectUri: string,
    pkioPrivateKey: string,
    environment: "acceptance" | "production" = "production",
) => {
    return new RvoClient({
        clientId,
        clientName,
        environment,
        tvs: {
            clientId,
            redirectUri,
            pkioPrivateKey,
        },
    })
}

export const generateAuthUrl = (rvoClient: RvoClient, state: string) => {
    return rvoClient.getAuthorizationUrl({ state })
}

export const exchangeToken = async (rvoClient: RvoClient, code: string) => {
    const tokenResponse = await rvoClient.exchangeAuthCode(code)
    return tokenResponse.accessToken
}
