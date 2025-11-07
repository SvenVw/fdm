/**
 * @file This file provides authentication services for the FDM application.
 *
 * It uses the `better-auth` library to handle user authentication, including social providers like Google
 * and Microsoft, as well as email-based magic links. It also manages user profiles, organizations, and sessions,
 * integrating tightly with the Drizzle ORM for database operations.
 */
import { betterAuth } from "better-auth"
import { drizzleAdapter } from "better-auth/adapters/drizzle"
import { magicLink, organization, username } from "better-auth/plugins"
import { eq } from "drizzle-orm"
import { generateFromEmail } from "unique-username-generator"
import type { FdmAuth } from "./authentication.d"
import * as authNSchema from "./db/schema-authn"
import { handleError } from "./error"
import type { FdmType } from "./fdm"

/**
 * Creates and configures an authentication instance for the FDM.
 *
 * This function initializes the `better-auth` library with database adapters, social providers (Google, Microsoft),
 * and various plugins like magic link and organization management. It also sets up session handling and
 * custom user fields, providing a comprehensive authentication solution for the FDM application.
 *
 * @param fdm The FDM instance for database access.
 * @param google Configuration for Google OAuth. Includes `clientId` and `clientSecret`. Optional.
 * @param microsoft Configuration for Microsoft OAuth. Includes `clientId` and `clientSecret`. Optional.
 * @param sendMagicLinkEmail A function to send magic link emails. Required for the magic link functionality. Optional.
 * @param emailAndPassword A boolean to enable or disable email and password authentication. Defaults to `false`.
 * @returns An initialized `FdmAuth` instance, ready to be used for authentication.
 * @throws An error if there's a configuration issue or a problem during initialization.
 */
export function createFdmAuth(
    fdm: FdmType,
    google?: { clientSecret: string; clientId: string },
    microsoft?: { clientSecret: string; clientId: string },
    sendMagicLinkEmail?: (email: string, url: string) => Promise<void>,
    emailAndPassword?: boolean,
): FdmAuth {
    // Setup social auth providers
    let googleAuth
    if (google) {
        googleAuth = {
            clientId: google?.clientId,
            clientSecret: google?.clientSecret,
            mapProfileToUser: async (profile: {
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
                    username: await createUsername(fdm, profile.email),
                    displayUsername: createDisplayUsername(
                        profile.given_name,
                        profile.family_name,
                    ),
                }
            },
        }
    }

    let microsoftAuth
    if (microsoft) {
        microsoftAuth = {
            clientId: microsoft.clientId,
            clientSecret: microsoft.clientSecret,
            tenantId: "common",
            mapProfileToUser: async (profile: {
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
                    username: await createUsername(fdm, profile.email),
                    displayUsername: createDisplayUsername(firstname, surname),
                }
            },
        }
    }

    const auth: FdmAuth = betterAuth({
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
            max: 100,
            storage: "database",
        },
        emailAndPassword: {
            enabled: emailAndPassword || false,
        },
        plugins: [
            username(),
            organization({
                organizationCreation: {
                    disabled: false, // Set to true to disable organization creation
                    beforeCreate: async ({ organization }) => {
                        return {
                            data: {
                                ...organization,
                                metadata: {
                                    isVerified: false,
                                    description: "",
                                },
                            },
                        }
                    },
                },
            }),
            magicLink({
                expiresIn: 60 * 15,
                sendMagicLink: async (
                    { email, url },
                    _request,
                ): Promise<void> => {
                    if (sendMagicLinkEmail) {
                        await sendMagicLinkEmail(email, url)

                        // Set username if user is new
                        const user = await fdm
                            .select({
                                id: authNSchema.user.id,
                                username: authNSchema.user.username,
                                email: authNSchema.user.email,
                            })
                            .from(authNSchema.user)
                            .where(eq(authNSchema.user.email, email))
                            .limit(1)

                        if (user.length > 0 && !user[0].username) {
                            await fdm
                                .update(authNSchema.user)
                                .set({
                                    username: await createUsername(fdm, email),
                                })
                                .where(eq(authNSchema.user.id, user[0].id))
                        }
                    } else {
                        console.warn(
                            "sendMagicLinkEmail function not provided to createFdmAuth. Magic link emails will not be sent.",
                        )
                    }
                },
            }),
        ],
        databaseHooks: {
            user: {
                create: {
                    after: async (user) => {
                        // Check if username is created after signup, otherwise add an username (typically when signed up with magic link)
                        const userName = await fdm
                            .select({
                                username: authNSchema.user.username,
                            })
                            .from(authNSchema.user)
                            .where(eq(authNSchema.user.id, user.id))
                            .limit(1)

                        if (userName.length > 0 && !userName[0].username) {
                            await fdm
                                .update(authNSchema.user)
                                .set({
                                    username: await createUsername(
                                        fdm,
                                        user.email,
                                    ),
                                })
                                .where(eq(authNSchema.user.id, user.id))
                        }
                    },
                },
            },
        },
    })

    return auth
}

/**
 * Updates a user's profile information in the database.
 *
 * This function allows for updating a user's first name, surname, and language preference.
 * It dynamically constructs the update query based on the provided fields. If the first name or surname
 * is updated, it also regenerates and updates the user's display name.
 *
 * @param fdm The FDM instance for database access.
 * @param user_id The unique identifier of the user to update.
 * @param firstname The user's new first name. Optional.
 * @param surname The user's new surname. Optional.
 * @param lang The user's new language preference. Currently supports "nl-NL". Optional.
 * @returns A promise that resolves when the profile has been successfully updated.
 * @throws An error if the database update fails.
 */
export async function updateUserProfile(
    fdm: FdmType,
    user_id: string,
    firstname?: string,
    surname?: string,
    lang?: "nl-NL",
): Promise<void> {
    try {
        return await fdm.transaction(async (tx: FdmType) => {
            const updatedFields: Partial<typeof authNSchema.user.$inferInsert> =
                {}
            if (firstname !== undefined) {
                updatedFields.firstname = firstname
            }
            if (surname !== undefined) {
                updatedFields.surname = surname
            }
            if (lang !== undefined) {
                updatedFields.lang = lang
            }

            // Update displayUsername if firstname or surname are updated
            if (firstname !== undefined || surname !== undefined) {
                const currentUser = await tx
                    .select({
                        firstname: authNSchema.user.firstname,
                        surname: authNSchema.user.surname,
                        username: authNSchema.user.username,
                    })
                    .from(authNSchema.user)
                    .where(eq(authNSchema.user.id, user_id))
                    .limit(1)

                if (currentUser.length > 0) {
                    const currentFirstname =
                        firstname !== undefined
                            ? firstname
                            : currentUser[0].firstname
                    const currentSurname =
                        surname !== undefined ? surname : currentUser[0].surname
                    updatedFields.displayUsername = createDisplayUsername(
                        currentFirstname,
                        currentSurname,
                    )

                    // Build `name` from non-null parts (or set to null if none)
                    const nameParts = [currentFirstname, currentSurname].filter(
                        (part) => part != null,
                    )
                    updatedFields.name =
                        nameParts.length > 0 ? nameParts.join(" ") : undefined
                }
            }

            if (Object.keys(updatedFields).length > 0) {
                await tx
                    .update(authNSchema.user)
                    .set(updatedFields)
                    .where(eq(authNSchema.user.id, user_id))
            }
        })
    } catch (err) {
        throw handleError(err, "Exception for updateUserProfile", {
            user_id,
            firstname,
            surname,
            lang,
        })
    }
}

/**
 * Splits a full name into a first name and a surname.
 *
 * This function handles various common formats, including names separated by spaces and the "LastName, FirstName"
 * convention. It returns an object containing the parsed first name and surname, or null for either if the
 * corresponding part is not found.
 *
 * @param fullName The full name string to be split. Can be undefined.
 * @returns An object with `firstname` and `surname` properties, which can be strings or null.
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

/**
 * Generates a unique username from an email address.
 *
 * This function creates a username from the user's email and ensures it is unique by checking against
 * existing usernames in the database. If a generated username already exists, it appends random digits
 * until a unique username is found.
 *
 * @param fdm The FDM instance providing the database connection.
 * @param email The user's email address, which is used to generate the username.
 * @returns A promise that resolves to a unique username string.
 */
async function createUsername(fdm: FdmType, email: string): Promise<string> {
    const digits = 3

    // Create username from email
    let username = generateFromEmail(email, digits)

    // Check if username already exists
    const existingUser = await fdm
        .select({
            username: authNSchema.user.username,
        })
        .from(authNSchema.user)
        .where(eq(authNSchema.user.username, username))
        .limit(1)

    // If username exists, append random digits until we find a unique one
    if (existingUser && existingUser.length > 0) {
        while (existingUser) {
            username = generateFromEmail(email, digits)
            const checkUser = await fdm
                .select({
                    username: authNSchema.user.username,
                })
                .from(authNSchema.user)
                .where(eq(authNSchema.user.username, username))
                .limit(1)
            if (checkUser && checkUser.length === 0) break
        }
    }

    return username
}

/**
 * Creates a display username from the user's first and last names.
 *
 * This function takes the user's first name and surname, filters out any null or empty parts, and joins them
 * with a space to create a full name. If both names are null or empty, it returns null.
 *
 * @param firstname The user's first name. Can be null or undefined.
 * @param surname The user's last name. Can be null or undefined.
 * @returns The formatted display name as a string, or null if both names are empty.
 */
export function createDisplayUsername(
    firstname: string | null | undefined,
    surname: string | null | undefined,
): string | null {
    // Filter out null or empty name parts and join with a space
    const nameParts = [firstname, surname].filter((part) => part?.trim())
    const name = nameParts.join(" ")

    // If no name is given return null
    if (!name || name.trim() === "") {
        return null
    }

    return name
}
