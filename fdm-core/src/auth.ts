import type { FdmType } from "./fdm"
import { betterAuth } from "better-auth"
import { drizzleAdapter } from "better-auth/adapters/drizzle"
import * as authSchema from "../src/db/schema-auth"

type BetterAuth = ReturnType<typeof betterAuth>

export function createFdmAuthServer(fdm: FdmType): BetterAuth {
    const auth: BetterAuth = betterAuth({
        database: drizzleAdapter(fdm, {
            provider: "pg",        
            schema: authSchema,
        }),
        user: {
            additionalFields: {
                firstname: {
                    type: "string",
                    required: false,
                    defaultValue: null,
                },
                surname: {
                    type: "string",
                    required: false,
                    defaultValue: null,
                },
                lang: {
                    type: "string",
                    required: true,
                    defaultValue: "nl-NL",
                },
                farm_active: {
                    type: "string",
                    required: false,
                    defaultValue: null,
                },
            },
        },
        session: {
            expiresIn: 60 * 60 * 24 * 30, // 30 days
            updateAge: 60 * 60 * 24, // 1 day (every 1 day the session expiration is updated)
        },
        socialProviders: {
            google: {
                clientId: process.env.GOOGLE_CLIENT_ID as string,
                clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
                mapProfileToUser: (profile) => {
                    return {
                        name: profile.name,
                        email: profile.email,
                        image: profile.picture,
                        firstname: profile.given_name,
                        surname: profile.family_name,
                    }
                },
            },
            microsoft: {
                clientId: process.env.MS_CLIENT_ID as string,
                clientSecret: process.env.MS_CLIENT_SECRET as string,
                tenantId: "common",
                requireSelectAccount: true,
                mapProfileToUser: (profile) => {
                    return {
                        name: profile.name,
                        email: profile.email,
                        image: profile.picture,
                    }
                },
            },
        },
        rateLimit: {
            storage: "database",
        },
    })

    return auth
}


