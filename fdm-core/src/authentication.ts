import { betterAuth } from "better-auth"
import { drizzleAdapter } from "better-auth/adapters/drizzle"
import { grantRole } from "./authorization"
import * as authNSchema from "./db/schema-authn"
import { handleError } from "./error"
import type { FdmType } from "./fdm"

export type BetterAuth = ReturnType<typeof betterAuth>

export function createFdmAuth(fdm: FdmType): BetterAuth {
    // Validate all required environment variables upfront
    const googleClientId = getRequiredEnvVar("GOOGLE_CLIENT_ID")
    const googleClientSecret = getRequiredEnvVar("GOOGLE_CLIENT_SECRET")
    const msClientId = getRequiredEnvVar("MS_CLIENT_ID")
    const msClientSecret = getRequiredEnvVar("MS_CLIENT_SECRET")

    const auth: BetterAuth = betterAuth({
        database: drizzleAdapter(fdm, {
            provider: "pg",
            schema: authNSchema,
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
                clientId: googleClientId,
                clientSecret: googleClientSecret,
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
                clientId: msClientId,
                clientSecret: msClientSecret,
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
        databaseHooks: {
            user: {
                create: {
                    after: async (user) => {
                        // Grant user owner role after account creation
                        const userId = user.id
                        try {
                            await grantRole(
                                fdm,
                                "farm",
                                "owner",
                                userId,
                                userId,
                            )
                        } catch (err) {
                            throw handleError(
                                err,
                                "Exception for granting user owner role",
                                {
                                    userId,
                                },
                            )
                        }
                    },
                },
            },
        },
        rateLimit: {
            storage: "database",
        },
    })

    return auth
}

function getRequiredEnvVar(name: string): string {
    const value = process.env[name]
    if (!value) {
        throw new Error(`Required environment variable ${name} is not set`)
    }
    return value
}
