import { betterAuth } from "better-auth"
import { drizzleAdapter } from "better-auth/adapters/drizzle"
import { grantRole } from "./authorization"
import * as authNSchema from "./db/schema-authn"
import { handleError } from "./error"
import type { FdmType } from "./fdm"

export type BetterAuth = ReturnType<typeof betterAuth>

/**
 * Initializes and configures the authentication system for the farm management application.
 *
 * This function sets up the better-auth system with a PostgreSQL database adapter and a custom schema.
 * It validates that required environment variables for Google and Microsoft authentication are set,
 * configures additional user fields (firstname, surname, lang, farm_active), and manages session parameters
 * with a 30-day expiration and daily update. It also defines mappings from social provider profiles to user
 * formats and registers a post-user-creation hook to assign the "owner" role to new users.
 *
 * @param fdm - The farm management instance used for database operations and role assignments.
 * @returns The configured authentication instance.
 *
 * @throws {Error} If required environment variables are missing or if role assignment fails.
 */
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

/**
 * Retrieves the value of an environment variable.
 *
 * @param name - The name of the environment variable to retrieve.
 * @returns The value of the environment variable.
 * @throws {Error} If the environment variable is not set.
 */
function getRequiredEnvVar(name: string): string {
    const value = process.env[name]
    if (!value) {
        throw new Error(`Required environment variable ${name} is not set`)
    }
    return value
}
