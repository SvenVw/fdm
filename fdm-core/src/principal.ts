import { handleError } from "./error"
import type { FdmType } from "./fdm"
import type { Principal } from "./principal.d"
import * as authNSchema from "./db/schema-authn"
import { eq } from "drizzle-orm"

/**
 * Retrieves details of a principal (either a user or an organization) by ID.
 *
 * This function attempts to retrieve details first from the user table, and if not found,
 * then from the organization table.
 *
 * @param fdm - The FDM instance providing the connection to the database.
 * @param principal_id - The unique identifier of the principal.
 * @returns A promise that resolves to an object containing the principal's details,
 *   or null if the principal is not found. The resolved object includes the name, image, type,
 *   and verification status of the principal.
 *
 * @throws {Error} - Throws an error if any database operation fails.
 *   The error includes a message and context information about the failed operation.
 *
 * @example
 * ```typescript
 * // Example usage:
 * const principalDetails = await getPrincipal(fdm, "user123");
 * if (principalDetails) {
 *   console.log("Principal Details:", principalDetails);
 * } else {
 *   console.log("Principal not found.");
 * }
 * ```
 */
export async function getPrincipal(
    fdm: FdmType,
    principal_id: string,
): Promise<Principal> {
    try {
        return await fdm.transaction(async (tx: FdmType) => {
            // If principal is an user get the details of the user
            const user = await tx
                .select({
                    username: authNSchema.user.username,
                    displayUserName: authNSchema.user.displayUsername,
                    image: authNSchema.user.image,
                    isVerified: authNSchema.user.emailVerified,
                })
                .from(authNSchema.user)
                .where(eq(authNSchema.user.id, principal_id))
                .limit(1)

            if (user.length > 0) {
                return {
                    username: user[0].username,
                    displayUserName: user[0].displayUserName,
                    image: user[0].image,
                    type: "user",
                    isVerified: user[0].isVerified,
                }
            }

            // If principal is an organization get the details of the organization
            const organization = await tx
                .select({
                    name: authNSchema.organization.name,
                    slug: authNSchema.organization.slug,
                    logo: authNSchema.organization.logo,
                    metadata: authNSchema.organization.metadata,
                })
                .from(authNSchema.organization)
                .where(eq(authNSchema.organization.id, principal_id))
                .limit(1)

            if (organization.length === 0) {
                return null
            }
            const metadata = JSON.parse(organization[0].metadata)

            return {
                username: organization[0].name,
                displayUserName: organization[0].slug,
                image: organization[0].logo,
                type: "organization",
                isVerified: metadata ? metadata.isVerified : false,
            }
        })
    } catch (err) {
        throw handleError(err, "Exception for getPrincipal", {
            principal_id: principal_id,
        })
    }
}
