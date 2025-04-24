import { eq } from "drizzle-orm"
import { beforeAll, describe, expect, inject, it } from "vitest"
import { getPrincipal, identifyPrincipal } from "./principal"
import type { FdmType } from "./fdm"
import { createFdmServer } from "./fdm-server"
import * as authNSchema from "./db/schema-authn"
import { createId } from "./id"
import { createOrganization } from "./organization"
import { createFdmAuth, type BetterAuth } from "./authentication"

describe("Principals", () => {
    let fdm: FdmType
    let user_id: string
    let organization_id: string
    let userName: string
    let organizationName: string
    let organizationSlug: string
    let userEmail: string
    let fdmAuth: BetterAuth

    beforeAll(async () => {
        const host = inject("host")
        const port = inject("port")
        const user = inject("user")
        const password = inject("password")
        const database = inject("database")
        fdm = createFdmServer(host, port, user, password, database)
        const googleAuth = {
            clientId: "mock_google_client_id",
            clientSecret: "mock_google_client_secret",
        }
        const microsoftAuth = {
            clientId: "mock_ms_client_id",
            clientSecret: "mock_ms_client_secret",
        }

        fdmAuth = createFdmAuth(fdm, googleAuth, microsoftAuth, true)
        userName = "testuser"
        userEmail = "user5@example.com"

        user_id = (
            await fdmAuth.api.signUpEmail({
                headers: undefined,
                body: {
                    email: userEmail,
                    name: "Test User",
                    firstname: "Test",
                    surname: "User",
                    username: userName,
                    password: "password",
                },
            })
        ).user.id

        organizationSlug = "test-org"
        organizationName = "Test Organization"
        organization_id = await createOrganization(
            fdm,
            user_id,
            organizationName,
            organizationSlug,
            "Test description",
        )
    })

    describe("getPrincipal", () => {
        it("should retrieve user details when principal_id is a user ID", async () => {
            const principal = await getPrincipal(fdm, user_id)
            expect(principal).toBeDefined()
            expect(principal.username).toBe(userName)
            expect(principal.type).toBe("user")
            expect(principal.image).toBeNull()
            expect(principal.isVerified).toBe(false)
        })

        it("should retrieve organization details when principal_id is an organization ID", async () => {
            const principal = await getPrincipal(fdm, organization_id)
            expect(principal).toBeDefined()
            expect(principal.username).toBe(organizationName)
            expect(principal.type).toBe("organization")
            expect(principal.image).toBeNull()
            expect(principal.isVerified).toBe(false)
        })

        it("should return null if principal_id does not exist in either user or organization table", async () => {
            const nonExistentId = createId()
            const principal = await getPrincipal(fdm, nonExistentId)
            expect(principal).toBeNull()
        })

        it("should handle database errors and throw an error", async () => {
            // Mock the transaction function to throw an error
            const mockTx = async () => {
                throw new Error("Database transaction failed")
            }
            const fdmMock = {
                ...fdm,
                transaction: mockTx,
            }
            // Act & Assert
            await expect(getPrincipal(fdmMock, user_id)).rejects.toThrowError(
                "Exception for getPrincipal",
            )
        })

        it("should retrieve user details even when image is null", async () => {
            // Update user to have null image
            await fdm
                .update(authNSchema.user)
                .set({ image: null })
                .where(eq(authNSchema.user.id, user_id))

            const principal = await getPrincipal(fdm, user_id)

            expect(principal).toBeDefined()
            expect(principal.username).toBe(userName)
            expect(principal.type).toBe("user")
            expect(principal.image).toBeNull()
            expect(principal.isVerified).toBe(false)
        })

        it("should retrieve organization details even when logo is null", async () => {
            // Update organization to have null logo
            await fdm
                .update(authNSchema.organization)
                .set({ logo: null })
                .where(eq(authNSchema.organization.id, organization_id))

            const principal = await getPrincipal(fdm, organization_id)

            expect(principal).toBeDefined()
            expect(principal.username).toBe(organizationName)
            expect(principal.type).toBe("organization")
            expect(principal.image).toBeNull()
            expect(principal.isVerified).toBe(false)
        })

        it("should handle organization with missing metadata", async () => {
            //Update organization without metadata
            await fdm
                .update(authNSchema.organization)
                .set({ metadata: null })
                .where(eq(authNSchema.organization.id, organization_id))
            const principal = await getPrincipal(fdm, organization_id)
            expect(principal).toBeDefined()
            expect(principal.username).toBe(organizationName)
            expect(principal.type).toBe("organization")
            expect(principal.image).toBeNull()
            expect(principal.isVerified).toBe(false)
        })
    })

    describe("identifyPrincipal", () => {
        it("should identify a principal by username", async () => {
            const principalDetails = await identifyPrincipal(fdm, userName)            
            expect(principalDetails).toBeDefined()
            expect(principalDetails?.id).toEqual(user_id)
            expect(principalDetails?.username).toBe(userName)
            expect(principalDetails?.type).toBe("user")
        })

        it("should identify a principal by email", async () => {
            const principalDetails = await identifyPrincipal(fdm, userEmail)
            console.log(principalDetails)
            expect(principalDetails).toBeDefined()
            expect(principalDetails?.id).toEqual( user_id)
            expect(principalDetails?.username).toBe(userName)
            expect(principalDetails?.type).toBe("user")
        })

        it("should identify a principal by organization slug", async () => {
            const principalDetails = await identifyPrincipal(
                fdm,
                organizationSlug,
            )            
            expect(principalDetails).toBeDefined()
            expect(principalDetails?.id).toEqual(organization_id)
            expect(principalDetails?.username).toBe("Test Organization")
            expect(principalDetails?.type).toBe("organization")
        })

        it("should return undefined if no principal is found", async () => {
            const nonExistentIdentifier = "nonexistent"
            const principalDetails = await identifyPrincipal(
                fdm,
                nonExistentIdentifier,
            )
            expect(principalDetails).toBeUndefined()
        })

        it("should handle database errors and throw an error", async () => {
            // Mock the transaction function to throw an error
            const mockTx = async () => {
                throw new Error("Database transaction failed")
            }
            const fdmMock = {
                ...fdm,
                transaction: mockTx,
            } as unknown as FdmType // Type assertion to FdmType

            // Act & Assert
            await expect(
                identifyPrincipal(fdmMock, userName),
            ).rejects.toThrowError("Exception for identifyPrincipal")
        })

        it("should prioritize username over organization slug if both exist", async () => {
            //Create an organization with the same slug as a username. This should never happen
            //in real world scenario, however, this unit test should demonstrate expected behaviour
            const conflictingSlug = userName
            const conflictingOrganization_id = await createOrganization(
                fdm,
                user_id,
                "Conflicting Organization",
                conflictingSlug,
                "Test description",
            )

            const principalDetails = await identifyPrincipal(
                fdm,
                conflictingSlug,
            )

            //The user should be prioritized.
            expect(principalDetails).toBeDefined()
            expect(principalDetails?.id).toEqual(user_id)
            expect(principalDetails?.username).toBe(userName)
            expect(principalDetails?.type).toBe("user")
            
            //Clean up conflicting organization
            await fdm
                .delete(authNSchema.organization)
                .where(
                    eq(authNSchema.organization.id, conflictingOrganization_id),
                )
                .execute()
        })
    })
})
