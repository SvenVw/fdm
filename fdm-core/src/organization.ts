import { and, asc, count, desc, eq, gt } from "drizzle-orm"
import * as authNSchema from "./db/schema-authn"
import { handleError } from "./error"
import type { FdmType } from "./fdm"
import { createId } from "./id"

/**
 * Creates a new organization and assigns the creating user as the owner.
 *
 * @param fdm - The FDM instance providing the connection to the database.
 * @param owner_id - The ID of the user creating the organization.
 * @param name - The name of the organization.
 * @param slug - The unique slug for the organization.
 * @param description - A description of the organization.
 * @returns A promise that resolves with the ID of the newly created organization.
 * @throws {Error} Throws an error if any database operation fails or if the input data is invalid.
 */
export async function createOrganization(
    fdm: FdmType,
    owner_id: string,
    name: string,
    slug: string,
    description: string,
): Promise<string> {
    try {
        return await fdm.transaction(async (tx: FdmType) => {
            // Generate an ID for the farm
            const organization_id = createId()
            // Insert the organization in the db
            const meta = {
                isVerified: false,
                description,
            }
            const organizationData = {
                id: organization_id,
                name: name,
                slug: slug,
                logo: null,
                createdAt: new Date(),
                metadata: JSON.stringify(meta),
            }
            await tx.insert(authNSchema.organization).values(organizationData)

            // Make the user owner of the organization
            const memberData = {
                id: createId(),
                organizationId: organization_id,
                userId: owner_id,
                role: "owner",
                createdAt: new Date(),
            }
            await tx.insert(authNSchema.member).values(memberData)

            return organization_id
        })
    } catch (err) {
        throw handleError(err, "Exception for createOrganization", {
            name,
            slug,
            description,
            owner_id,
        })
    }
}

/**
 * Updates an existing organization.
 *
 * @param fdm - The FDM instance providing the connection to the database.
 * @param admin_id - The ID of the user initiating the update (must be owner or admin).
 * @param organization_id - The ID of the organization to update.
 * @param name - (Optional) The new name of the organization.
 * @param slug - (Optional) The new unique slug for the organization.
 * @param description - (Optional) The new description of the organization.
 * @param logo - (Optional) The new logo of the organization.
 * @param isVerified - (Optional) set isVerified boolean.
 * @returns A promise that resolves when the organization has been updated.
 * @throws {Error} Throws an error if any database operation fails, if the user does not have permissions, or if input data is invalid.
 */
export async function updateOrganization(
    fdm: FdmType,
    admin_id: string,
    organization_id: string,
    name?: string,
    slug?: string,
    description?: string,
    logo?: string | null,
    isVerified?: boolean,
): Promise<void> {
    try {
        return await fdm.transaction(async (tx: FdmType) => {
            // Check if user has permission to update organization
            const permissions = await getUserOrganizationPermissions(
                tx,
                admin_id,
                organization_id,
            )
            if (!permissions.canEdit) {
                throw new Error("User has no permission to update organization")
            }

            const updatedMetadata = await tx
                .select({ metadata: authNSchema.organization.metadata })
                .from(authNSchema.organization)
                .where(eq(authNSchema.organization.id, organization_id))
                .limit(1)
            let metadata: { isVerified?: boolean; description?: string }
            if (updatedMetadata.length > 0) {
                metadata = JSON.parse(updatedMetadata[0].metadata)
            } else {
                metadata = {}
            }

            const updatedFields: Partial<
                typeof authNSchema.organization.$inferInsert
            > = {}
            if (name !== undefined) {
                updatedFields.name = name
            }
            if (slug !== undefined) {
                updatedFields.slug = slug
            }
            if (logo !== undefined) {
                updatedFields.logo = logo
            }

            if (description !== undefined) {
                metadata.description = description
            }
            if (isVerified !== undefined) {
                metadata.isVerified = isVerified
            }

            if (Object.keys(metadata).length > 0) {
                updatedFields.metadata = JSON.stringify(metadata)
            }

            if (Object.keys(updatedFields).length > 0) {
                await tx
                    .update(authNSchema.organization)
                    .set(updatedFields)
                    .where(eq(authNSchema.organization.id, organization_id))
            }
        })
    } catch (err) {
        throw handleError(err, "Exception for updateOrganization", {
            admin_id,
            organization_id,
            name,
            slug,
            description,
            logo,
            isVerified,
        })
    }
}

/**
 * Retrieves an organization by its ID.
 *
 * @param fdm - The FDM instance providing the connection to the database.
 * @param organization_slug - The slug of the organization to retrieve.
 * @param user_id - The ID of the user for whom to retrieve organizations.
 * @returns A promise that resolves with the organization details and permisssions of user, or null if not found.
 * @throws {Error} Throws an error if any database operation fails.
 */
export async function getOrganization(
    fdm: FdmType,
    organization_slug: string,
    user_id: string,
): Promise<{
    id: string
    name: string
    slug: string
    logo: string | null
    isVerified: boolean
    description: string
    permissions: OrganizationPermissions
} | null> {
    try {
        return await fdm.transaction(async (tx: FdmType) => {
            const organization = await tx
                .select({
                    id: authNSchema.organization.id,
                    name: authNSchema.organization.name,
                    slug: authNSchema.organization.slug,
                    logo: authNSchema.organization.logo,
                    metadata: authNSchema.organization.metadata,
                })
                .from(authNSchema.organization)
                .where(eq(authNSchema.organization.slug, organization_slug))
                .limit(1)

            if (organization.length === 0) {
                return null
            }

            // Get permissions for this organization
            const permissions = await getUserOrganizationPermissions(
                tx,
                user_id,
                organization[0].id,
            )

            const metadata = JSON.parse(organization[0].metadata)
            return {
                id: organization[0].id,
                name: organization[0].name,
                slug: organization[0].slug,
                logo: organization[0].logo,
                isVerified: metadata.isVerified ?? false,
                description: metadata.description ?? "",
                permissions: permissions,
            }
        })
    } catch (err) {
        throw handleError(err, "Exception for getOrganization", {
            organization_slug,
        })
    }
}

/**
 * Retrieves a list of organizations that a user is a part of.
 *
 * @param fdm - The FDM instance providing the connection to the database.
 * @param user_id - The ID of the user for whom to retrieve organizations.
 * @returns A promise that resolves with an array of organization details.
 * @throws {Error} Throws an error if any database operation fails.
 */
export async function getOrganizationsForUser(
    fdm: FdmType,
    user_id: string,
): Promise<
    {
        organization_id: string
        name: string
        slug: string
        role: string
        is_verified: boolean
        description: string
    }[]
> {
    try {
        const organizationRoles = await fdm
            .select({
                organization_id: authNSchema.member.organizationId,
                role: authNSchema.member.role,
                name: authNSchema.organization.name,
                slug: authNSchema.organization.slug,
                metadata: authNSchema.organization.metadata,
            })
            .from(authNSchema.member)
            .leftJoin(
                authNSchema.organization,
                eq(
                    authNSchema.member.organizationId,
                    authNSchema.organization.id,
                ),
            )
            .where(eq(authNSchema.member.userId, user_id))
            .orderBy(asc(authNSchema.member.createdAt))

        if (organizationRoles.length === 0) {
            return []
        }

        return organizationRoles.map(
            (role: {
                metadata: string
                organization_id: string
                name: string
                slug: string
                role: "owner" | "admin" | "member"
            }) => {
                const metadata = JSON.parse(role.metadata)
                return {
                    organization_id: role.organization_id,
                    name: role.name,
                    slug: role.slug,
                    role: role.role,
                    is_verified: metadata.isVerified,
                    description: metadata.description,
                }
            },
        )
    } catch (err) {
        throw handleError(err, "Exception for getOrganizationsForUser", {
            user_id,
        })
    }
}

/**
 * Retrieves a list of users that are members of a specific organization.
 *
 * @param fdm - The FDM instance providing the connection to the database.
 * @param organization_slug - The unique slug of the organization.
 * @returns A promise that resolves with an array of user details.
 * @throws {Error} Throws an error if any database operation fails.
 */
export async function getUsersInOrganization(
    fdm: FdmType,
    organization_slug: string,
): Promise<
    {
        username: string
        firstname: string
        surname: string
        image: string
        role: string
    }[]
> {
    try {
        const users = await fdm
            .select({
                username: authNSchema.user.username,
                firstname: authNSchema.user.firstname,
                surname: authNSchema.user.surname,
                image: authNSchema.user.image,
                role: authNSchema.member.role,
            })
            .from(authNSchema.organization)
            .leftJoin(
                authNSchema.member,
                eq(
                    authNSchema.organization.id,
                    authNSchema.member.organizationId,
                ),
            )
            .leftJoin(
                authNSchema.user,
                eq(authNSchema.member.userId, authNSchema.user.id),
            )
            .where(and(eq(authNSchema.organization.slug, organization_slug)))
            .orderBy(asc(authNSchema.member.createdAt))

        if (users.length === 0) {
            return []
        }

        return users
    } catch (err) {
        throw handleError(err, "Exception for getUsersInOrganization", {
            organization_slug,
        })
    }
}

/**
 * Invites a user to an organization.
 *
 * @param fdm - The FDM instance providing the connection to the database.
 * @param inviter_id - The ID of the user initiating the invitation (must be owner or admin).
 * @param email - The email address of the user being invited.
 * @param role - The role to assign to the invited user in the organization.
 * @param organization_id - The ID of the organization to which the user is being invited.
 * @returns A promise that resolves with the ID of the newly created invitation.
 * @throws {Error} Throws an error if any database operation fails, if the user does not have permissions, or if input data is invalid.
 */
export async function inviteUserToOrganization(
    fdm: FdmType,
    inviter_id: string,
    email: string,
    role: "owner" | "admin" | "member",
    organization_id: string,
): Promise<string> {
    try {
        return await fdm.transaction(async (tx: FdmType) => {
            // Check if user has permission to invite
            const permissions = await getUserOrganizationPermissions(
                tx,
                inviter_id,
                organization_id,
            )
            if (!permissions.canInvite) {
                throw new Error("User has no permission to invite")
            }

            // Generate an ID for the invitation
            const invitation_id = createId()
            // Insert the invitation in the db
            const invitationData = {
                id: invitation_id,
                organizationId: organization_id,
                email: email,
                role: role,
                status: "pending",
                expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7), // 7 days
                inviterId: inviter_id,
            }
            await tx.insert(authNSchema.invitation).values(invitationData)

            return invitation_id
        })
    } catch (err) {
        throw handleError(err, "Exception for inviteUserToOrganization", {
            inviter_id,
            email,
            role,
            organization_id,
        })
    }
}

/**
 * Retrieves a list of pending invitations for a specific organization.
 *
 * @param fdm - The FDM instance providing the connection to the database.
 * @param organization_id - The id of the organization.
 * @returns A promise that resolves with an array of pending invitation details, including the email, role, expiration date, and inviter's name.
 * @throws {Error} Throws an error if any database operation fails.
 */
export async function getPendingInvitationsForOrganization(
    fdm: FdmType,
    organization_id: string,
): Promise<
    {
        invitation_id: string
        email: string
        role: string
        expires_at: Date
        inviter_firstname: string
        inviter_surname: string
    }[]
> {
    try {
        const invitations = await fdm
            .select({
                invitation_id: authNSchema.invitation.id,
                email: authNSchema.invitation.email,
                role: authNSchema.invitation.role,
                expires_at: authNSchema.invitation.expiresAt,
                inviter_firstname: authNSchema.user.firstname,
                inviter_surname: authNSchema.user.surname,
            })
            .from(authNSchema.organization)
            .leftJoin(
                authNSchema.invitation,
                eq(
                    authNSchema.organization.id,
                    authNSchema.invitation.organizationId,
                ),
            )
            .leftJoin(
                authNSchema.user,
                eq(authNSchema.invitation.inviterId, authNSchema.user.id),
            )
            .where(
                and(
                    eq(authNSchema.organization.id, organization_id),
                    eq(authNSchema.invitation.status, "pending"),
                    gt(authNSchema.invitation.expiresAt, new Date()),
                ),
            )
            .orderBy(asc(authNSchema.invitation.expiresAt))

        if (invitations.length === 0) {
            return []
        }

        return invitations
    } catch (err) {
        throw handleError(
            err,
            "Exception for getPendingInvitationsForOrganization",
            {
                organization_id,
            },
        )
    }
}

/**
 * Retrieves a list of pending invitations for a specific user.
 *
 * @param fdm - The FDM instance providing the connection to the database.
 * @param user_id - The ID of the user for whom to retrieve pending invitations.
 * @returns A promise that resolves with an array of pending invitation details.
 * @throws {Error} Throws an error if any database operation fails.
 */
export async function getPendingInvitationsForUser(
    fdm: FdmType,
    user_id: string,
): Promise<
    {
        invitation_id: string
        organization_id: string
        organization_name: string
        organization_slug: string
        role: string
        expires_at: Date
        inviter_firstname: string
        inviter_surname: string
        inviter_image: string
    }[]
> {
    try {
        const invitations = await fdm
            .select({
                invitation_id: authNSchema.invitation.id,
                organization_id: authNSchema.invitation.organizationId,
                organization_name: authNSchema.organization.name,
                organization_slug: authNSchema.organization.slug,
                role: authNSchema.invitation.role,
                expires_at: authNSchema.invitation.expiresAt,
                inviter_firstname: authNSchema.user.firstname,
                inviter_surname: authNSchema.user.surname,
                inviter_image: authNSchema.user.image,
            })
            .from(authNSchema.invitation)
            .leftJoin(
                authNSchema.organization,
                eq(
                    authNSchema.invitation.organizationId,
                    authNSchema.organization.id,
                ),
            )
            .leftJoin(
                authNSchema.user,
                eq(authNSchema.invitation.inviterId, authNSchema.user.id),
            )
            .where(
                and(
                    eq(
                        authNSchema.invitation.email,
                        fdm
                            .select({ email: authNSchema.user.email })
                            .from(authNSchema.user)
                            .where(eq(authNSchema.user.id, user_id)),
                    ),
                    eq(authNSchema.invitation.status, "pending"),
                    gt(authNSchema.invitation.expiresAt, new Date()),
                ),
            )
            .orderBy(desc(authNSchema.invitation.expiresAt))

        if (invitations.length === 0) {
            return []
        }

        return invitations
    } catch (err) {
        throw handleError(err, "Exception for getPendingInvitationsForUser", {
            user_id,
        })
    }
}

/**
 * Retrieves the details of a specific pending invitation.
 *
 * @param fdm - The FDM instance providing the connection to the database.
 * @param invitation_id - The ID of the invitation to retrieve.
 * @returns A promise that resolves with the pending invitation details.
 * @throws {Error} Throws an error if any database operation fails or if the invitation is not found.
 */
export async function getPendingInvitation(
    fdm: FdmType,
    invitation_id: string,
): Promise<{
    invitation_id: string
    organization_id: string
    organization_name: string
    organization_slug: string
    role: string
    expires_at: Date
    inviter_firstname: string
    inviter_surname: string
    inviter_image: string
}> {
    try {
        const invitation = await fdm
            .select({
                invitation_id: authNSchema.invitation.id,
                organization_id: authNSchema.invitation.organizationId,
                organization_name: authNSchema.organization.name,
                organization_slug: authNSchema.organization.slug,
                role: authNSchema.invitation.role,
                expires_at: authNSchema.invitation.expiresAt,
                inviter_firstname: authNSchema.user.firstname,
                inviter_surname: authNSchema.user.surname,
                inviter_image: authNSchema.user.image,
            })
            .from(authNSchema.invitation)
            .leftJoin(
                authNSchema.organization,
                eq(
                    authNSchema.invitation.organizationId,
                    authNSchema.organization.id,
                ),
            )
            .leftJoin(
                authNSchema.user,
                eq(authNSchema.invitation.inviterId, authNSchema.user.id),
            )
            .where(eq(authNSchema.invitation.id, invitation_id))
            .limit(1)

        if (invitation.length === 0) {
            throw new Error("Invitation not found")
        }

        return invitation[0]
    } catch (err) {
        throw handleError(err, "Exception for getPendingInvitation", {
            invitation_id,
        })
    }
}

/**
 * Accepts an invitation to join an organization.
 *
 * @param fdm - The FDM instance providing the connection to the database.
 * @param invitation_id - The ID of the invitation to accept.
 * @param user_id - The ID of the user accepting the invitation.
 * @throws {Error} Throws an error if any database operation fails, if the invitation is not found, is not pending, or has expired.
 */
export async function acceptInvitation(
    fdm: FdmType,
    invitation_id: string,
    user_id: string,
): Promise<void> {
    try {
        await fdm.transaction(async (tx: FdmType) => {
            // Check if invitation exists
            const invitation = await tx
                .select({
                    organization_id: authNSchema.invitation.organizationId,
                    role: authNSchema.invitation.role,
                    status: authNSchema.invitation.status,
                    expiresAt: authNSchema.invitation.expiresAt,
                })
                .from(authNSchema.invitation)
                .leftJoin(
                    authNSchema.user,
                    eq(authNSchema.invitation.email, authNSchema.user.email),
                )
                .where(
                    and(
                        eq(authNSchema.invitation.id, invitation_id),
                        eq(authNSchema.user.id, user_id),
                    ),
                )
                .limit(1)
            if (invitation.length === 0) {
                throw new Error("Invitation not found")
            }
            if (invitation[0].status !== "pending") {
                throw new Error("Invitation is not pending")
            }
            if (invitation[0].expiresAt < new Date()) {
                throw new Error("Invitation has expired")
            }

            // Add user to organization
            const memberData = {
                id: createId(),
                organizationId: invitation[0].organization_id,
                userId: user_id,
                role: invitation[0].role,
                createdAt: new Date(),
            }
            await tx.insert(authNSchema.member).values(memberData)

            // Update invitation status
            await tx
                .update(authNSchema.invitation)
                .set({ status: "accepted" })
                .where(eq(authNSchema.invitation.id, invitation_id))
        })
    } catch (err) {
        throw handleError(err, "Exception for acceptInvitation", {
            invitation_id,
            user_id,
        })
    }
}

/**
 * Rejects an invitation to join an organization.
 *
 * @param fdm - The FDM instance providing the connection to the database.
 * @param invitation_id - The ID of the invitation to reject.
 * @param user_id - The ID of the user rejecting the invitation.
 * @throws {Error} Throws an error if any database operation fails, if the invitation is not found, or if the invitation is not pending.
 */
export async function rejectInvitation(
    fdm: FdmType,
    invitation_id: string,
    user_id: string,
): Promise<void> {
    try {
        await fdm.transaction(async (tx: FdmType) => {
            // Check if invitation exists
            const invitation = await tx
                .select({
                    status: authNSchema.invitation.status,
                })
                .from(authNSchema.invitation)
                .leftJoin(
                    authNSchema.user,
                    eq(authNSchema.invitation.email, authNSchema.user.email),
                )
                .where(
                    and(
                        eq(authNSchema.invitation.id, invitation_id),
                        eq(authNSchema.user.id, user_id),
                    ),
                )
                .limit(1)
            if (invitation.length === 0) {
                throw new Error("Invitation not found")
            }
            if (invitation[0].status !== "pending") {
                throw new Error("Invitation is not pending")
            }

            // Update invitation status
            await tx
                .update(authNSchema.invitation)
                .set({ status: "rejected" })
                .where(eq(authNSchema.invitation.id, invitation_id))
        })
    } catch (err) {
        throw handleError(err, "Exception for rejectInvitation", {
            invitation_id,
            user_id,
        })
    }
}

/**
 * Removes a user from an organization.
 *
 * @param fdm - The FDM instance providing the connection to the database.
 * @param admin_id - The ID of the user initiating the removal (must be owner or admin).
 * @param organization_id - The ID of the organization from which the user is being removed.
 * @param username - The username of the user being removed.
 * @throws {Error} Throws an error if any database operation fails, if the user initiating the removal does not have permissions, or if the user to be removed is not found.
 */
export async function removeUserFromOrganization(
    fdm: FdmType,
    admin_id: string,
    organization_id: string,
    username: string,
): Promise<void> {
    try {
        return await fdm.transaction(async (tx: FdmType) => {
            // Check if user has permission to remove user
            const permissions = await getUserOrganizationPermissions(
                tx,
                admin_id,
                organization_id,
            )
            if (!permissions.canRemoveUser) {
                throw new Error("User has no permission to remove user")
            }

            // Remove user from organization based on username
            const userToRemove = await tx
                .select({ id: authNSchema.user.id })
                .from(authNSchema.user)
                .where(eq(authNSchema.user.username, username))
                .limit(1)
            if (userToRemove.length === 0) {
                throw new Error("User to remove not found")
            }
            await tx
                .delete(authNSchema.member)
                .where(
                    and(
                        eq(authNSchema.member.userId, userToRemove[0].id),
                        eq(authNSchema.member.organizationId, organization_id),
                    ),
                )

            // Check that at least 1 user is owner of the organization
            const ownerCount = await tx
                .select({ count: count(authNSchema.member.id) })
                .from(authNSchema.member)
                .where(
                    and(
                        eq(authNSchema.member.organizationId, organization_id),
                        eq(authNSchema.member.role, "owner"),
                    ),
                )
            if (ownerCount.length === 0 || ownerCount[0].count === 0) {
                throw new Error("Organization must have at least 1 owner")
            }
        })
    } catch (err) {
        throw handleError(err, "Exception for removeUserFromOrganization", {
            admin_id,
            organization_id,
            username,
        })
    }
}

/**
 * Updates the role of a user within an organization.
 *
 * @param fdm - The FDM instance providing the connection to the database.
 * @param admin_id - The ID of the user initiating the update (must be owner or admin).
 * @param organization_id - The ID of the organization in which the user's role is being updated.
 * @param username - The username of the user whose role is being updated.
 * @param role - The new role to assign to the user.
 * @throws {Error} Throws an error if any database operation fails, if the user initiating the update does not have permissions, or if the user to be updated is not found.
 */
export async function updateRoleOfUserAtOrganization(
    fdm: FdmType,
    admin_id: string,
    organization_id: string,
    username: string,
    role: "owner" | "admin" | "member",
): Promise<void> {
    try {
        return await fdm.transaction(async (tx: FdmType) => {
            // Check if user has permission to update organization
            const permissions = await getUserOrganizationPermissions(
                tx,
                admin_id,
                organization_id,
            )
            if (!permissions.canUpdateRoleUser) {
                throw new Error(
                    "User has no permission to update role of user in the organization",
                )
            }

            // Update user at organization based on username
            const userToUpdate = await tx
                .select({ id: authNSchema.user.id })
                .from(authNSchema.user)
                .where(eq(authNSchema.user.username, username))
                .limit(1)
            if (userToUpdate.length === 0) {
                throw new Error("User to update not found")
            }
            await tx
                .update(authNSchema.member)
                .set({ role: role })
                .where(
                    and(
                        eq(authNSchema.member.userId, userToUpdate[0].id),
                        eq(authNSchema.member.organizationId, organization_id),
                    ),
                )

            // Check that at least 1 user is owner of the organization
            const ownerCount = await tx
                .select({ count: count(authNSchema.member.id) })
                .from(authNSchema.member)
                .where(
                    and(
                        eq(authNSchema.member.organizationId, organization_id),
                        eq(authNSchema.member.role, "owner"),
                    ),
                )
            if (ownerCount.length === 0 || ownerCount[0].count === 0) {
                throw new Error("Organization must have at least 1 owner")
            }
        })
    } catch (err) {
        throw handleError(err, "Exception for updateRoleOfUserAtOrganization", {
            admin_id,
            organization_id,
            username,
            role,
        })
    }
}

/**
 * Deletes an organization.
 *
 * @param fdm - The FDM instance providing the connection to the database.
 * @param owner_id - The ID of the user initiating the deletion (must be the owner).
 * @param organization_id - The ID of the organization to delete.
 * @throws {Error} Throws an error if any database operation fails, if the user initiating the deletion is not the owner, or if the organization is not found.
 */
export async function deleteOrganization(
    fdm: FdmType,
    owner_id: string,
    organization_id: string,
): Promise<void> {
    try {
        return await fdm.transaction(async (tx: FdmType) => {
            // Check if user has permission to delete organization
            const permissions = await getUserOrganizationPermissions(
                tx,
                owner_id,
                organization_id,
            )
            if (!permissions.canDelete) {
                throw new Error("User has no permission to delete organization")
            }

            // Delete organization
            await tx
                .delete(authNSchema.organization)
                .where(eq(authNSchema.organization.id, organization_id))
        })
    } catch (err) {
        throw handleError(err, "Exception for deleteOrganization", {
            owner_id,
            organization_id,
        })
    }
}

/**
 * Checks if a given organization slug is available (not already in use).
 *
 * @param fdm - The FDM instance providing the connection to the database.
 * @param organization_slug - The slug to check for availability.
 * @returns A promise that resolves with a boolean indicating whether the slug is available. True if available, false if not.
 * @throws {Error} Throws an error if any database operation fails or if the slug is invalid
 */
export async function checkOrganizationSlugForAvailability(
    fdm: FdmType,
    organization_slug: string,
): Promise<boolean> {
    try {
        // Validate if organization_slug is a valid slug
        if (!/^[a-z0-9-]+$/.test(organization_slug)) {
            throw new Error("Invalid organization slug")
        }

        // Check if slug is available
        const existingOrganization = await fdm
            .select({ id: authNSchema.organization.id })
            .from(authNSchema.organization)
            .where(eq(authNSchema.organization.slug, organization_slug))
            .limit(1)

        // Check if slug is not already an username
        const existingUsername = await fdm
            .select({ id: authNSchema.user.id })
            .from(authNSchema.user)
            .where(eq(authNSchema.user.username, organization_slug))
            .limit(1)

        return (
            existingOrganization.length === 0 && existingUsername.length === 0
        )
    } catch (err) {
        throw handleError(
            err,
            "Exception for checkOrganizationSlugForAvailability",
            {
                organization_slug,
            },
        )
    }
}

/**
 * Cancels a pending invitation to join an organization.
 *
 * @param fdm - The FDM instance providing the connection to the database.
 * @param invitation_id - The ID of the invitation to cancel.
 * @param admin_id - The ID of the user initiating the cancellation (must be owner or admin).
 * @throws {Error} Throws an error if any database operation fails, if the inviter does not have permissions, or if the invitation is not found.
 */
export async function cancelPendingInvitation(
    fdm: FdmType,
    invitation_id: string,
    admin_id: string,
): Promise<void> {
    try {
        await fdm.transaction(async (tx: FdmType) => {
            // Check if invitation exists
            const invitation = await tx
                .select({
                    organization_id: authNSchema.invitation.organizationId,
                    status: authNSchema.invitation.status,
                })
                .from(authNSchema.invitation)
                .where(eq(authNSchema.invitation.id, invitation_id))
                .limit(1)

            if (invitation.length === 0) {
                throw new Error("Invitation not found")
            }
            if (invitation[0].status !== "pending") {
                throw new Error("Invitation is not pending")
            }

            // Check if user has permission to invite users
            const permissions = await getUserOrganizationPermissions(
                tx,
                admin_id,
                invitation[0].organization_id,
            )
            if (!permissions.canInvite) {
                throw new Error(
                    "User has no permission to cancel invitation to organization",
                )
            }

            // Set status of invitation to cancelled
            await tx
                .update(authNSchema.invitation)
                .set({ status: "cancelled" })
                .where(eq(authNSchema.invitation.id, invitation_id))
        })
    } catch (err) {
        throw handleError(err, "Exception for cancelPendingInvitation", {
            invitation_id,
            admin_id,
        })
    }
}

/**
 * Defines the structure of the permissions object.
 */
interface OrganizationPermissions {
    canView: boolean
    canEdit: boolean
    canDelete: boolean
    canInvite: boolean
    canUpdateRoleUser: boolean
    canRemoveUser: boolean
}

type OrganizationRole = "owner" | "admin" | "member" | "viewer"

/**
 * Retrieves the permissions of a user within a specified organization.
 *
 * @param tx - The database transaction object.
 * @param user_id - The ID of the user.
 * @param organization_id - The ID of the organization.
 * @returns A promise that resolves to an OrganizationPermissions object.
 * @throws {Error} Throws an error if the user is not a member of the organization.
 */
async function getUserOrganizationPermissions(
    tx: FdmType,
    user_id: string,
    organization_id: string,
): Promise<OrganizationPermissions> {
    const member = await tx
        .select({ role: authNSchema.member.role })
        .from(authNSchema.member)
        .where(
            and(
                eq(authNSchema.member.userId, user_id),
                eq(authNSchema.member.organizationId, organization_id),
            ),
        )
        .limit(1)

    let role: OrganizationRole = "viewer"
    if (member.length !== 0) {
        role = member[0].role
    }

    // Define permissions based on role
    const permissions: OrganizationPermissions = {
        canView:
            role === "viewer" ||
            role === "member" ||
            role === "admin" ||
            role === "owner",
        canEdit: role === "owner" || role === "admin",
        canDelete: role === "owner",
        canInvite: role === "owner" || role === "admin",
        canUpdateRoleUser: role === "owner" || role === "admin",
        canRemoveUser: role === "owner" || role === "admin",
    }

    return permissions
}
