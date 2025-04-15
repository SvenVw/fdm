import { betterAuth } from "better-auth"
import { drizzleAdapter } from "better-auth/adapters/drizzle"
import * as authNSchema from "./db/schema-authn"
import type { FdmType } from "./fdm"
import { organization } from "better-auth/plugins"

export type BetterAuth = ReturnType<typeof betterAuth>

/**
 * Initializes and configures the authentication system for the farm management application.
 *
 * This function sets up the better-auth system with a PostgreSQL database adapter and a custom schema.
 * It validates that required environment variables for Google and Microsoft authentication are set,
 * configures additional user fields (firstname, surname, lang, farm_active), and manages session parameters
 * with a 30-day expiration and daily update. It also defines mappings from social provider profiles to user
 * formats.
 *
 * @param fdm The FDM instance providing the connection to the database. The instance can be created with {@link createFdmServer}.
 * @returns The configured authentication instance.
 *
 * @throws {Error} If required environment variables are missing or if role assignment fails.
 */
export function createFdmAuth(
    fdm: FdmType,
    google?: { clientSecret: string; clientId: string },
    microsoft?: { clientSecret: string; clientId: string },
): BetterAuth {
    // Setup social auth providers
    let googleAuth = undefined
    if (google) {
        googleAuth = {
            clientId: google?.clientId,
            clientSecret: google?.clientSecret,
            mapProfileToUser: (profile: {
                name: string
                email: string
                picture: string
                given_name: string
                family_name: string
            }) => {
                return {
                    name: profile.name,
                    email: profile.email,
                    image: profile.picture,
                    firstname: profile.given_name,
                    surname: profile.family_name,
                }
            },
        }
    }

    let microsoftAuth = undefined
    if (microsoft) {
        microsoftAuth = {
            clientId: microsoft.clientId,
            clientSecret: microsoft.clientSecret,
            tenantId: "common",
            requireSelectAccount: true,
            mapProfileToUser: (profile: {
                name: string | undefined
                email: string
                picture: string
            }) => {
                const { firstname, surname } = splitFullName(profile.name)
                return {
                    name: profile.name,
                    email: profile.email,
                    image: profile.picture,
                    firstname: firstname,
                    surname: surname,
                }
            },
        }
    }

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
            google: googleAuth,
            microsoft: microsoftAuth,
        },
        rateLimit: {
            enabled: process.env.NODE_ENV === "production",
            window: 10,
            limit: 100,
            storage: "database",
        },
        plugins: [
            organization({
                organizationCreation: {
                    disabled: false, // Set to true to disable organization creation
                    beforeCreate: async ({ organization }) => {
                        return {
                            data: {
                                ...organization,
                                metadata: {
                                    isVerified: false,
                                },
                            },
                        }
                    },
                },
            }),
        ],
    })

    return auth
}

/**
 * Splits a full name into first name and surname, handling various formats including "LastName, FirstName".
 *
 * @param fullName - The full name string.
 * @returns An object containing the first name and surname.
 */
export function splitFullName(fullName: string | undefined): {
    firstname: string | null
    surname: string | null
} {
    if (!fullName || fullName.trim() === "") {
        return { firstname: null, surname: null }
    }

    const trimmedName = fullName.trim()
    // Check for "LastName, FirstName" format
    if (trimmedName.includes(",")) {
        const parts = trimmedName.split(",").map((part) => part.trim())
        if (parts.length === 2) {
            return { firstname: parts[1], surname: parts[0] }
        }
    }

    const names = trimmedName.split(/\s+/) // Split by one or more spaces

    if (names.length === 1) {
        // Only one name provided
        return { firstname: names[0], surname: null }
    }

    // Multiple names provided
    const firstname = names[0]
    const surname = names.slice(-1)[0] // Get the last name
    return { firstname, surname }
}
