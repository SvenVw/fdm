import { eq } from "drizzle-orm"
import { beforeAll, describe, expect, inject, it } from "vitest"
import { getPrincipal } from "./principal"
import type { FdmType } from "./fdm"
import { createFdmServer } from "./fdm-server"
import * as authNSchema from "./db/schema-authn"
import { createId } from "./id"
import { createOrganization } from "./organization"
import { createFdmAuth, type BetterAuth } from "./authentication"

describe("getPrincipal", () => {
    let fdm: FdmType
    let user_id: string
    let organization_id: string
    let userName: string
    let organizationName: string
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
        organizationName = "Test Organization"

        organization_id = await createOrganization(
            fdm,
            user_id,
            organizationName,
            "test-org",
            "Test description",
        )
    })

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
