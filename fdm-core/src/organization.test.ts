import { eq } from "drizzle-orm"
import { afterAll, beforeAll, describe, expect, inject, it } from "vitest"
import { type BetterAuth, createFdmAuth } from "./authentication"
import * as authNSchema from "./db/schema-authn"
import { createFdmServer } from "./fdm-server"
import type { FdmServerType } from "./fdm-server.d"
import { createId } from "./id"
import {
    acceptInvitation,
    cancelPendingInvitation,
    checkOrganizationSlugForAvailability,
    createOrganization,
    deleteOrganization,
    getOrganization,
    getOrganizationsForUser,
    getPendingInvitation,
    getPendingInvitationsForOrganization,
    getPendingInvitationsForUser,
    getUsersInOrganization,
    inviteUserToOrganization,
    rejectInvitation,
    removeUserFromOrganization,
    updateOrganization,
    updateRoleOfUserAtOrganization,
} from "./organization"

describe("Organization Data Model", () => {
    let fdm: FdmServerType
    let user1_id: string
    let user2_id: string
    let user3_id: string
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
                    firstname: "user2",
                    surname: "user2",
                    password: "password",
                },
            })
            user2_id = user2.user.id

            const user3 = await fdmAuth.api.signUpEmail({
                headers: undefined,
                body: {
                    email: "user3@example.com",
                    name: "user3",
                    firstname: "user3",
                    surname: "user3",
                    password: "password",
                },
            })
            user3_id = user3.user.id
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

        it("should throw an error if createOrganization fails", async () => {
            const name = "Test Organization"
            const slug = "test-organization-28"
            const description = "This is a test organization"
            // Create an unique constraint violation
            await createOrganization(fdm, user1_id, name, slug, description)
            await expect(
                createOrganization(fdm, user1_id, name, slug, description),
            ).rejects.toThrow("Exception for createOrganization")
        })

        it("should get organizations for a user", async () => {
            const name = "Test Organization 2"
            const slug = "test-organization-2"
            const description = "This is a test organization"
            await createOrganization(fdm, user1_id, name, slug, description)

            const organizations = await getOrganizationsForUser(fdm, user1_id)
            expect(organizations).toBeDefined()
            expect(organizations.length).toBeGreaterThanOrEqual(1)
            const foundOrganization = organizations.find(
                (org) => org.slug === slug,
            )
            expect(foundOrganization).toBeDefined()
            expect(foundOrganization?.name).toEqual(name)
        })

        it("should return empty array if user is not member of any organization", async () => {
            // Create a error condition for the database
            await fdm.delete(authNSchema.member).execute()
            const organizations = await getOrganizationsForUser(fdm, user1_id)
            expect(organizations).toBeDefined()
            expect(organizations.length).toBe(0)
            //add the user again
            await fdm.insert(authNSchema.member).values({
                id: createId(),
                organizationId: (
                    await fdm.select().from(authNSchema.organization).limit(1)
                )[0].id,
                userId: user1_id,
                role: "owner",
                createdAt: new Date(),
            })
        })

        it("should get users in an organization", async () => {
            const name = "Test Organization"
            const slug = "test-organization-22"
            const description = "This is a test organization"
            await createOrganization(fdm, user1_id, name, slug, description)

            const users = await getUsersInOrganization(fdm, slug)
            expect(users).toBeDefined()
            expect(users.length).toBe(1)
            expect(users[0].firstname).toEqual("user1")
        })

        it("should return empty array when no users in organization", async () => {
            const name = "Test Organization"
            const slug = "test-organization-31"
            const description = "This is a test organization"
            await createOrganization(fdm, user1_id, name, slug, description)
            // Create a error condition for the database
            await fdm.delete(authNSchema.organization).execute()
            const members = await getUsersInOrganization(fdm, slug)
            expect(members).toBeDefined()
            expect(members.length).toBe(0)

            // add the organization again
            await createOrganization(fdm, user1_id, name, slug, description)
        })

        it("should check organization slug for availability", async () => {
            const name = "Test Organization"
            const slug = "test-organization-42"
            const description = "This is a test organization"
            await createOrganization(fdm, user1_id, name, slug, description)

            const isAvailable = await checkOrganizationSlugForAvailability(
                fdm,
                slug,
            )
            expect(isAvailable).toBe(false)

            const isAvailable2 = await checkOrganizationSlugForAvailability(
                fdm,
                "test-organization-43",
            )
            expect(isAvailable2).toBe(true)

            await expect(
                checkOrganizationSlugForAvailability(fdm, "INVALID_SLUG"),
            ).rejects.toThrow(
                "Exception for checkOrganizationSlugForAvailability",
            )
        })

        it("should invite user to organization", async () => {
            const name = "Test Organization"
            const slug = "test-organization-74"
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

            const invitations = await getPendingInvitationsForUser(
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

        it("should throw an error if user is not member of organization when inviting", async () => {
            const name = "Test Organization"
            const slug = "test-organization-102"
            const description = "This is a test organization"
            const organization_id = await createOrganization(
                fdm,
                user1_id,
                name,
                slug,
                description,
            )
            await expect(
                inviteUserToOrganization(
                    fdm,
                    user3_id,
                    "user3@example.com",
                    "member",
                    organization_id,
                ),
            ).rejects.toThrow("Exception for inviteUserToOrganization")
        })

        it("should return empty array when no pending invitations", async () => {
            const invitations = await getPendingInvitationsForUser(
                fdm,
                user3_id,
            )
            await expect(invitations).toBeDefined()
            expect(invitations.length).toBe(0)
        })

        it("should throw an error if getPendingInvitationsForUser fails", async () => {
            // Create a error condition for the database
            await fdm.delete(authNSchema.invitation).execute()
            const invitations = await getPendingInvitationsForUser(
                fdm,
                user2_id,
            )
            await expect(invitations).toBeDefined()
            expect(invitations.length).toBe(0)

            // add the invitation again
            const name = "Test Organization"
            const slug = "test-organization-83"
            const description = "This is a test organization"
            const organization_id = await createOrganization(
                fdm,
                user1_id,
                name,
                slug,
                description,
            )

            await inviteUserToOrganization(
                fdm,
                user1_id,
                "user2@example.com",
                "member",
                organization_id,
            )
        })
        it("should throw error when non existing invitation requested", async () => {
            await expect(getPendingInvitation(fdm, createId())).rejects.toThrow(
                "Exception for getPendingInvitation",
            )
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

            await expect(
                rejectInvitation(fdm, invitationId, user2_id),
            ).rejects.toThrow("Exception for rejectInvitation")
        })
        it("should return an empty array if there are no pending invitations", async () => {
            const slug = "test-organization-97"

            const organization_id = await createOrganization(
                fdm,
                user1_id,
                "Test Org",
                slug,
                "Test Description",
            )
            const invitations = await getPendingInvitationsForOrganization(
                fdm,
                organization_id,
            )
            expect(invitations).toEqual([])
        })

        it("should return a list of pending invitations for the organization", async () => {
            const email2 = "test2@example.com"
            const role = "member"
            const slug = "test-organization-94"

            const organization_id = await createOrganization(
                fdm,
                user1_id,
                "Test Org",
                slug,
                "Test Description",
            )

            await inviteUserToOrganization(
                fdm,
                user1_id,
                email2,
                role,
                organization_id,
            )

            const invitations = await getPendingInvitationsForOrganization(
                fdm,
                organization_id,
            )

            expect(invitations.length).toBe(1)
            expect(invitations.map((invitation) => invitation.email)).toEqual(
                expect.arrayContaining([email2]),
            )
        })

        it("should not return rejected invitations", async () => {
            const email2 = "user2@example.com"
            const role = "member"
            const slug = "test-organization-89"

            const organization_id = await createOrganization(
                fdm,
                user1_id,
                "Test Org",
                slug,
                "Test Description",
            )

            const invitation_id = await inviteUserToOrganization(
                fdm,
                user1_id,
                email2,
                role,
                organization_id,
            )

            // Reject one invitation
            await rejectInvitation(fdm, invitation_id, user2_id)

            const invitations = await getPendingInvitationsForOrganization(
                fdm,
                organization_id,
            )

            expect(invitations.length).toBe(0)
        })

        it("should throw an error if the organization does not exist", async () => {
            const nonExistentSlug = "non-existent-org"

            const invitations = await getPendingInvitationsForOrganization(
                fdm,
                nonExistentSlug,
            )
            expect(invitations).toEqual([])
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

            await expect(
                removeUserFromOrganization(
                    fdm,
                    user1_id,
                    organization_id,
                    "user3@example.com",
                ),
            ).resolves.toBeUndefined()
        })
        it("should throw an error if removing last owner", async () => {
            const name = "Test Organization"
            const slug = "test-organization-remove-owner"
            const description = "This is a test organization"
            const organization_id = await createOrganization(
                fdm,
                user1_id,
                name,
                slug,
                description,
            )

            await expect(
                removeUserFromOrganization(
                    fdm,
                    user1_id,
                    organization_id,
                    "user1@example.com",
                ),
            ).rejects.toThrow("Exception for removeUserFromOrganization")
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

            await expect(
                updateRoleOfUserAtOrganization(
                    fdm,
                    user1_id,
                    organization_id,
                    "user3@example.com",
                    "admin",
                ),
            ).resolves.toBeUndefined()
        })

        it("should throw an error if updating user role results in no owners", async () => {
            const name = "Test Organization"
            const slug = "test-organization-no-owner"
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

            await expect(
                updateRoleOfUserAtOrganization(
                    fdm,
                    user1_id,
                    organization_id,
                    "user1@example.com",
                    "admin",
                ),
            ).rejects.toThrow("Exception for updateRoleOfUserAtOrganization")
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

            await expect(
                deleteOrganization(fdm, user1_id, organization_id),
            ).rejects.toThrow("Exception for deleteOrganization")
        })

        it("should accept invitation", async () => {
            const name = "Test Organization"
            const slug = "test-organization-101"
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

            const member = await getUsersInOrganization(fdm, slug)
            expect(member).toBeDefined()
            expect(member.find((x) => x.firstname === "user2")?.role).toBe(
                "member",
            )

            await expect(
                acceptInvitation(fdm, invitationId, user2_id),
            ).rejects.toThrow("Exception for acceptInvitation")
        })

        it("should throw an error if user is not owner or admin when inviting", async () => {
            const name = "Test Organization"
            const slug = "test-organization-112"
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
            await acceptInvitation(fdm, invitationId, user2_id)
            await expect(
                inviteUserToOrganization(
                    fdm,
                    user2_id,
                    "user3@example.com",
                    "member",
                    organization_id,
                ),
            ).rejects.toThrow("Exception for inviteUserToOrganization")
        })
        it("should handle invalid organization slug", async () => {
            await expect(
                checkOrganizationSlugForAvailability(fdm, ""),
            ).rejects.toThrow(
                "Exception for checkOrganizationSlugForAvailability",
            )
            await expect(
                checkOrganizationSlugForAvailability(fdm, "Invalid Slug"),
            ).rejects.toThrow(
                "Exception for checkOrganizationSlugForAvailability",
            )
        })

        describe("cancelPendingInvitation", () => {
            it("should cancel a pending invitation", async () => {
                const name = "Test Organization"
                const slug = "test-organization-cancel-1"
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

                await cancelPendingInvitation(fdm, invitationId, user1_id)

                const invitation = await fdm
                    .select()
                    .from(authNSchema.invitation)
                    .where(eq(authNSchema.invitation.id, invitationId))
                    .limit(1)

                expect(invitation[0].status).toBe("cancelled")
            })

            it("should throw an error if invitation does not exist", async () => {
                await expect(
                    cancelPendingInvitation(fdm, createId(), user1_id),
                ).rejects.toThrow("Exception for cancelPendingInvitation")
            })

            it("should throw an error if user is not admin or owner of organization", async () => {
                const name = "Test Organization"
                const slug = "test-organization-cancel-2"
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

                await expect(
                    cancelPendingInvitation(fdm, invitationId, user3_id),
                ).rejects.toThrow("Exception for cancelPendingInvitation")
            })
            it("should throw an error if user is not member of organization", async () => {
                const name = "Test Organization"
                const slug = "test-organization-cancel-3"
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
                const user_not_member = createId()

                await expect(
                    cancelPendingInvitation(fdm, invitationId, user_not_member),
                ).rejects.toThrow("Exception for cancelPendingInvitation")
            })
        })

        describe("updateOrganization", () => {
            let organization_id: string

            beforeAll(async () => {
                // Create an organization before a test
                const name = "Test Organization"
                const slug = "test-organization-update-62"
                const description = "This is a test organization"
                organization_id = await createOrganization(
                    fdm,
                    user1_id,
                    name,
                    slug,
                    description,
                )
            })

            it("should allow partial updates", async () => {
                const updatedName = "Partially Updated Org"
                const updatedDescription = "Updated Description only"
                const oldLogo = "/old-logo.png"
                await updateOrganization(
                    fdm,
                    user1_id,
                    organization_id,
                    undefined,
                    undefined,
                    updatedDescription,
                    oldLogo,
                    undefined,
                )

                await updateOrganization(
                    fdm,
                    user1_id,
                    organization_id,
                    updatedName,
                    undefined,
                    undefined,
                    undefined,
                    undefined,
                )

                const organization = await fdm
                    .select()
                    .from(authNSchema.organization)
                    .where(eq(authNSchema.organization.id, organization_id))
                    .limit(1)

                expect(organization[0].name).toBe(updatedName)
                const metadata = JSON.parse(organization[0].metadata)
                expect(metadata.description).toBe(updatedDescription)
                expect(organization[0].logo).toBe(oldLogo)
            })

            it("should throw an error if user is not an owner or admin", async () => {
                const name = "Test Organization"
                const slug = "test-organization-77"
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
                await acceptInvitation(fdm, invitationId, user2_id)
                await expect(
                    updateOrganization(
                        fdm,
                        user2_id,
                        organization_id,
                        "New Name",
                        "new-slug",
                        "New description",
                        null,
                        false,
                    ),
                ).rejects.toThrow("Exception for updateOrganization")
            })

            it("should throw an error if user is not a member of the organization", async () => {
                const new_user_id = createId()
                await expect(
                    updateOrganization(
                        fdm,
                        new_user_id,
                        organization_id,
                        "New Name",
                        "new-slug",
                        "New description",
                        null,
                        false,
                    ),
                ).rejects.toThrow("Exception for updateOrganization")
            })
            it("should update organization logo", async () => {
                const updatedLogo = "/new-logo.png"
                await updateOrganization(
                    fdm,
                    user1_id,
                    organization_id,
                    undefined,
                    undefined,
                    undefined,
                    updatedLogo,
                    undefined,
                )
                const organization = await fdm
                    .select()
                    .from(authNSchema.organization)
                    .where(eq(authNSchema.organization.id, organization_id))
                    .limit(1)
                expect(organization[0].logo).toBe(updatedLogo)
            })
            it("should update isVerified boolean", async () => {
                const updatedIsVerified = true
                await updateOrganization(
                    fdm,
                    user1_id,
                    organization_id,
                    undefined,
                    undefined,
                    undefined,
                    undefined,
                    updatedIsVerified,
                )
                const organization = await fdm
                    .select()
                    .from(authNSchema.organization)
                    .where(eq(authNSchema.organization.id, organization_id))
                    .limit(1)
                const metadata = JSON.parse(organization[0].metadata)
                expect(metadata.isVerified).toBe(updatedIsVerified)
            })

            it("should set null as logo", async () => {
                const updatedLogo = null
                await updateOrganization(
                    fdm,
                    user1_id,
                    organization_id,
                    undefined,
                    undefined,
                    undefined,
                    updatedLogo,
                    undefined,
                )
                const organization = await fdm
                    .select()
                    .from(authNSchema.organization)
                    .where(eq(authNSchema.organization.id, organization_id))
                    .limit(1)
                expect(organization[0].logo).toBe(updatedLogo)
            })
        })
        describe("getOrganization", () => {
            it("should get an organization", async () => {
                const name = "Test Organization"
                const slug = "test-organization-get-1"
                const description = "This is a test organization"
                const organization_id = await createOrganization(
                    fdm,
                    user1_id,
                    name,
                    slug,
                    description,
                )
                const organization = await getOrganization(fdm, slug, user1_id)

                expect(organization).toBeDefined()
                expect(organization?.id).toBe(organization_id)
                expect(organization?.name).toBe(name)
                expect(organization?.slug).toBe(slug)
                expect(organization?.description).toBe(description)
            })

            it("should return null if organization does not exist", async () => {
                const organization = await getOrganization(
                    fdm,
                    createId(),
                    user1_id,
                )
                expect(organization).toBeNull()
            })

            it("should retrieve permissions", async () => {
                const name = "Test Organization"
                const slug = "test-organization-permission-get"
                const description = "This is a test organization"
                const organization_id = await createOrganization(
                    fdm,
                    user1_id,
                    name,
                    slug,
                    description,
                )
                const organizationOwner = await getOrganization(
                    fdm,
                    slug,
                    user1_id,
                )
                expect(organizationOwner).toBeDefined()
                expect(organizationOwner?.permissions.canEdit).toBe(true)
                expect(organizationOwner?.permissions.canDelete).toBe(true)
                expect(organizationOwner?.permissions.canInvite).toBe(true)
                expect(organizationOwner?.permissions.canUpdateRoleUser).toBe(
                    true,
                )
                expect(organizationOwner?.permissions.canRemoveUser).toBe(true)

                const invitationId = await inviteUserToOrganization(
                    fdm,
                    user1_id,
                    "user2@example.com",
                    "member",
                    organization_id,
                )
                await acceptInvitation(fdm, invitationId, user2_id)

                const organizationMember = await getOrganization(
                    fdm,
                    slug,
                    user2_id,
                )
                expect(organizationMember).toBeDefined()
                expect(organizationMember?.permissions.canEdit).toBe(false)
                expect(organizationMember?.permissions.canDelete).toBe(false)
                expect(organizationMember?.permissions.canInvite).toBe(false)
                expect(organizationMember?.permissions.canUpdateRoleUser).toBe(
                    false,
                )
                expect(organizationMember?.permissions.canRemoveUser).toBe(
                    false,
                )

                await updateRoleOfUserAtOrganization(
                    fdm,
                    user1_id,
                    organization_id,
                    "user2@example.com",
                    "admin",
                )

                const organizationAdmin = await getOrganization(
                    fdm,
                    slug,
                    user2_id,
                )
                expect(organizationAdmin).toBeDefined()
                expect(organizationAdmin?.permissions.canEdit).toBe(true)
                expect(organizationAdmin?.permissions.canDelete).toBe(false)
                expect(organizationAdmin?.permissions.canInvite).toBe(true)
                expect(organizationAdmin?.permissions.canUpdateRoleUser).toBe(
                    true,
                )
                expect(organizationAdmin?.permissions.canRemoveUser).toBe(true)
            })
        })
    })
})
