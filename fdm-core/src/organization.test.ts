import { eq } from "drizzle-orm"
import {
    afterAll,
    beforeAll,
    beforeEach,
    describe,
    expect,
    inject,
    it,
} from "vitest"
import {
    acceptInvitation,
    checkOrganizationSlugForAvailabilty,
    createOrganization,
    deleteOrganization,
    getOrganizationsForUser,
    getPendingInvitation,
    getPendingInvitationsforUser,
    getUsersInOrganization,
    inviteUserToOrganization,
    rejectInvitation,
    removeUserFromOrganization,
    updateRoleOfUserAtOrganization,
} from "./organization"
import { createFdmServer } from "./fdm-server"
import type { FdmServerType } from "./fdm-server.d"
import * as authNSchema from "./db/schema-authn"
import { createId } from "./id"
import { type BetterAuth, createFdmAuth } from "./authentication"
import { afterEach } from "node:test"

describe("Organization Data Model", () => {
    let fdm: FdmServerType
    let user1_id: string
    let user2_id: string
    let fdmAuth: BetterAuth

    beforeAll(async () => {
        const host = inject("host")
        const port = inject("port")
        const user = inject("user")
        const password = inject("password")
        const database = inject("database")
        // Mock environment variables
        const googleAuth = {
            clientId: "mock_google_client_id",
            clientSecret: "mock_google_client_secret",
        }
        const microsoftAuth = {
            clientId: "mock_ms_client_id",
            clientSecret: "mock_ms_client_secret",
        }

        fdm = createFdmServer(host, port, user, password, database)

        fdmAuth = createFdmAuth(fdm, googleAuth, microsoftAuth, true)
        try {
            const user1 = await fdmAuth.api.signUpEmail({
                headers: undefined,
                body: {
                    email: "user1@example.com",
                    name: "user1",
                    firstname: "user1",
                    surname: "user1",
                    password: "password",
                },
            })
            user1_id = user1.user.id

            const user2 = await fdmAuth.api.signUpEmail({
                headers: undefined,
                body: {
                    email: "user2@example.com",
                    name: "user2",
                    firstname: "user1",
                    surname: "user1",
                    password: "password",
                },
            })
            user2_id = user2.user.id
        } catch (error) {
            console.error("Error creating user:", error)
            throw error // Re-throw the error after logging
        }
    })

    afterAll(async () => {
        // Clean up authN tables
        try {
            await fdm.delete(authNSchema.session).execute()
            await fdm.delete(authNSchema.user).execute()
            await fdm.delete(authNSchema.verification).execute()
            await fdm.delete(authNSchema.invitation).execute()
            await fdm.delete(authNSchema.member).execute()
            await fdm.delete(authNSchema.organization).execute()
        } catch (error) {
            console.error("Error cleaning up authN tables:", error)
        }
    })

    describe("Organization CRUD", () => {
        it("should create a new organization", async () => {
            const name = "Test Organization"
            const slug = "test-organization-37"
            const description = "This is a test organization"
            const organization_id = await createOrganization(
                fdm,
                user1_id,
                name,
                slug,
                description,
            )
            expect(organization_id).toBeDefined()

            const organization = await fdm
                .select()
                .from(authNSchema.organization)
                .where(eq(authNSchema.organization.id, organization_id))
                .limit(1)
            expect(organization).toHaveLength(1)
            expect(organization[0].name).toBe(name)
            expect(organization[0].slug).toBe(slug)
        })

        it("should get organizations for a user", async () => {
            const name = "Test Organization 2"
            const slug = "test-organization-2"
            const description = "This is a test organization"
            const organization_id = await createOrganization(
                fdm,
                user1_id,
                name,
                slug,
                description,
            )

            const organizations = await getOrganizationsForUser(fdm, user1_id)
            expect(organizations).toBeDefined()
            expect(organizations.length).toBeGreaterThanOrEqual(1)
            const foundOrganization = organizations.find(
                (org) => org.slug === slug,
            )
            expect(foundOrganization).toBeDefined()
            expect(foundOrganization?.name).toEqual(name)
        })

        it("should get users in an organization", async () => {
            const name = "Test Organization"
            const slug = "test-organization-22"
            const description = "This is a test organization"
            await createOrganization(fdm, user1_id, name, slug, description)

            const users = await getUsersInOrganization(fdm, slug)
            expect(users).toBeDefined()
            expect(users.length).toBeGreaterThanOrEqual(0)
        })

        it("should check organization slug for availability", async () => {
            const name = "Test Organization"
            const slug = "test-organization-42"
            const description = "This is a test organization"
            await createOrganization(fdm, user1_id, name, slug, description)

            const isAvailable = await checkOrganizationSlugForAvailabilty(
                fdm,
                slug,
            )
            expect(isAvailable).toBe(false)

            const isAvailable2 = await checkOrganizationSlugForAvailabilty(
                fdm,
                "test-organization-43",
            )
            expect(isAvailable2).toBe(true)
        })

        it("should invite user to organization", async () => {
            const name = "Test Organization"
            const slug = "test-organization-73"
            const description = "This is a test organization"
            const organization_id = await createOrganization(
                fdm,
                user1_id,
                name,
                slug,
                description,
            )

            const invitationId = await inviteUserToOrganization(
                fdm,
                user1_id,
                "user2@example.com",
                "member",
                organization_id,
            )
            expect(invitationId).toBeDefined()

            const invitations = await getPendingInvitationsforUser(
                fdm,
                user2_id,
            )
            await expect(invitations).toBeDefined()

            const invitation = await getPendingInvitation(fdm, invitationId)
            expect(invitation).toBeDefined()
            expect(invitation.organization_id).toBe(organization_id)
            expect(invitation.role).toBe("member")
            expect(invitation.inviter_firstname).toBe("user1")
            expect(invitation.inviter_surname).toBe("user1")
            expect(invitation.inviter_image).toBeNull()
            expect(invitation.expires_at).toBeDefined()
            expect(invitation.expires_at).toBeInstanceOf(Date)
        })

        it("should reject invitation", async () => {
            const name = "Test Organization"
            const slug = "test-organization-99"
            const description = "This is a test organization"
            const organization_id = await createOrganization(
                fdm,
                user1_id,
                name,
                slug,
                description,
            )

            const invitationId = await inviteUserToOrganization(
                fdm,
                user1_id,
                "user2@example.com",
                "member",
                organization_id,
            )
            expect(invitationId).toBeDefined()

            await rejectInvitation(fdm, invitationId, user2_id)
            const invitation = await fdm
                .select()
                .from(authNSchema.invitation)
                .where(eq(authNSchema.invitation.id, invitationId))
                .limit(1)

            expect(invitation[0].status).toBe("rejected")
        })

        it("should remove user from organization", async () => {
            const name = "Test Organization"
            const slug = "test-organization-53"
            const description = "This is a test organization"
            const organization_id = await createOrganization(
                fdm,
                user1_id,
                name,
                slug,
                description,
            )

            const invitationId = await inviteUserToOrganization(
                fdm,
                user1_id,
                "user2@example.com",
                "member",
                organization_id,
            )
            expect(invitationId).toBeDefined()

            await acceptInvitation(fdm, invitationId, user2_id)

            await removeUserFromOrganization(
                fdm,
                user1_id,
                organization_id,
                "user2@example.com",
            )

            const organizations = await getOrganizationsForUser(fdm, user2_id)
            expect(organizations).toBeDefined()
            expect(
                organizations.find((org) => org.slug === slug),
            ).toBeUndefined()
        })

        it("should update role of user at organization", async () => {
            const name = "Test Organization"
            const slug = "test-organization-19"
            const description = "This is a test organization"
            const organization_id = await createOrganization(
                fdm,
                user1_id,
                name,
                slug,
                description,
            )

            const newUserEmail = "user2@example.com"
            const invitationId = await inviteUserToOrganization(
                fdm,
                user1_id,
                newUserEmail,
                "member",
                organization_id,
            )
            expect(invitationId).toBeDefined()

            await acceptInvitation(fdm, invitationId, user2_id)           

            await updateRoleOfUserAtOrganization(
                fdm,
                user1_id,
                organization_id,
                newUserEmail,
                "admin",
            )

            const organizations = await getOrganizationsForUser(fdm, user2_id)
            expect(organizations).toBeDefined()
            expect(
                organizations.find((org) => org.slug === slug)?.organization_id,
            ).toBe(organization_id)
            expect(organizations.find((org) => org.slug === slug)?.role).toBe(
                "admin",
            )
        })

        it("should delete an organization", async () => {
            const name = "Test Organization"
            const slug = "test-organization-24"
            const description = "This is a test organization"
            const organization_id = await createOrganization(
                fdm,
                user1_id,
                name,
                slug,
                description,
            )

            await deleteOrganization(fdm, user1_id, organization_id)

            const organization = await fdm
                .select()
                .from(authNSchema.organization)
                .where(eq(authNSchema.organization.id, organization_id))
                .limit(1)
            expect(organization).toHaveLength(0)
        })
    })
})
