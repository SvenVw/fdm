/**
 * @file This file contains functions for managing organic certifications in the FDM.
 *
 * It provides functionalities to add, remove, list, and validate organic certifications for a farm.
 */
import { and, eq, gte, inArray, lte } from "drizzle-orm"
import { checkPermission } from "./authorization"
import type { PrincipalId } from "./authorization.d"
import * as schema from "./db/schema"
import { handleError } from "./error"
import type { FdmType } from "./fdm"
import { createId } from "./id"
import type { OrganicCertification } from "./organic.d"

/**
 * Regular expression for validating EU TRACES document numbers for Organic Operator Certificates.
 * Examples: NL-BIO-01.528-0002967.2025.001, NL-BIO-01.528-0005471.2025.001
 */
const TRACES_REGEX = /^NL-BIO-\d{2}\.\d{3}-\d{7}\.\d{4}\.\d{3}$/

/**
 * Regular expression for validating SKAL numbers.
 * Examples: 026281, 024295
 */
const SKAL_REGEX = /^\d{6}$/

/**
 * Validates the format of an EU TRACES document number.
 *
 * @param tracesNumber The TRACES document number to validate.
 * @returns `true` if the format is valid, otherwise `false`.
 */
export function isValidTracesNumber(tracesNumber: string): boolean {
    return TRACES_REGEX.test(tracesNumber)
}

/**
 * Validates the format of a SKAL number.
 *
 * @param skalNumber The SKAL number to validate.
 * @returns `true` if the format is valid, otherwise `false`.
 */
export function isValidSkalNumber(skalNumber: string): boolean {
    return SKAL_REGEX.test(skalNumber)
}

/**
 * Adds an organic certification to a farm.
 *
 * This function records a new organic certification, including its TRACES and SKAL numbers,
 * and its validity period.
 *
 * @param fdm The FDM instance for database access.
 * @param principal_id The identifier of the principal making the request.
 * @param b_id_farm The unique identifier of the farm.
 * @param b_organic_traces The TRACES number of the certification.
 * @param b_organic_skal The SKAL number of the certification.
 * @param b_organic_issued The issue date of the certification.
 * @param b_organic_expires The expiry date of the certification.
 * @returns A promise that resolves to the unique identifier of the new certification.
 * @throws An error if the principal does not have permission, or if the provided data is invalid.
 */
export async function addOrganicCertification(
    fdm: FdmType,
    principal_id: PrincipalId,
    b_id_farm: schema.farmsTypeInsert["b_id_farm"],
    b_organic_traces: schema.organicCertificationsTypeInsert["b_organic_traces"],
    b_organic_skal: schema.organicCertificationsTypeInsert["b_organic_skal"],
    b_organic_issued: schema.organicCertificationsTypeInsert["b_organic_issued"],
    b_organic_expires: schema.organicCertificationsTypeInsert["b_organic_expires"],
): Promise<schema.organicCertificationsTypeInsert["b_id_organic"]> {
    if (b_organic_traces && !isValidTracesNumber(b_organic_traces)) {
        throw new Error("Invalid TRACES document number format.")
    }
    if (b_organic_skal && !isValidSkalNumber(b_organic_skal)) {
        throw new Error("Invalid SKAL number format.")
    }
    if (
        b_organic_issued &&
        b_organic_expires &&
        b_organic_issued.getTime() >= b_organic_expires.getTime()
    ) {
        throw new Error("Issue date must be before expiry date.")
    }

    try {
        return await fdm.transaction(async (tx: FdmType) => {
            await checkPermission(
                tx,
                "farm",
                "write",
                b_id_farm,
                principal_id,
                "addOrganicCertification",
            )

            const existingCertification = await tx
                .select({ id: schema.organicCertifications.b_id_organic })
                .from(schema.organicCertifications)
                .leftJoin(
                    schema.organicCertificationsHolding,
                    eq(
                        schema.organicCertifications.b_id_organic,
                        schema.organicCertificationsHolding.b_id_organic,
                    ),
                )
                .where(
                    and(
                        eq(
                            schema.organicCertificationsHolding.b_id_farm,
                            b_id_farm,
                        ),
                        b_organic_traces
                            ? eq(
                                  schema.organicCertifications.b_organic_traces,
                                  b_organic_traces,
                              )
                            : undefined,
                        b_organic_skal
                            ? eq(
                                  schema.organicCertifications.b_organic_skal,
                                  b_organic_skal,
                              )
                            : undefined,
                    ),
                )
                .limit(1)

            if (existingCertification.length > 0) {
                throw new Error(
                    "Organic certification with similar TRACES/SKAL number already exists for this farm.",
                )
            }

            const b_id_organic = createId()
            await tx.insert(schema.organicCertifications).values({
                b_id_organic,
                b_organic_traces,
                b_organic_skal,
                b_organic_issued,
                b_organic_expires,
            })

            await tx.insert(schema.organicCertificationsHolding).values({
                b_id_farm,
                b_id_organic,
            })

            return b_id_organic
        })
    } catch (err) {
        throw handleError(err, "Exception for addOrganicCertification", {
            b_id_farm,
            b_organic_traces,
            b_organic_skal,
        })
    }
}

/**
 * Removes an organic certification from a farm.
 *
 * @param fdm The FDM instance for database access.
 * @param principal_id The identifier of the principal making the request.
 * @param b_id_organic The unique identifier of the organic certification to remove.
 * @returns A promise that resolves when the certification has been successfully removed.
 * @throws An error if the principal does not have permission or if the certification is not found.
 */
export async function removeOrganicCertification(
    fdm: FdmType,
    principal_id: PrincipalId,
    b_id_organic: schema.organicCertificationsTypeInsert["b_id_organic"],
): Promise<void> {
    try {
        await fdm.transaction(async (tx: FdmType) => {
            const holding = await tx
                .select()
                .from(schema.organicCertificationsHolding)
                .where(
                    eq(
                        schema.organicCertificationsHolding.b_id_organic,
                        b_id_organic,
                    ),
                )

            if (!holding[0]) {
                throw new Error("Organic certification not found on any farm.")
            }

            await checkPermission(
                tx,
                "farm",
                "write",
                holding[0].b_id_farm,
                principal_id,
                "removeOrganicCertification",
            )

            await tx
                .delete(schema.organicCertificationsHolding)
                .where(
                    eq(
                        schema.organicCertificationsHolding.b_id_organic,
                        b_id_organic,
                    ),
                )

            await tx
                .delete(schema.organicCertifications)
                .where(
                    eq(schema.organicCertifications.b_id_organic, b_id_organic),
                )
        })
    } catch (err) {
        throw handleError(err, "Exception for removeOrganicCertification", {
            b_id_organic,
        })
    }
}

/**
 * Lists all organic certifications for a farm.
 *
 * @param fdm The FDM instance for database access.
 * @param principal_id The identifier of the principal making the request.
 * @param b_id_farm The unique identifier of the farm.
 * @returns A promise that resolves to an array of `OrganicCertification` objects.
 * @throws An error if the principal does not have permission.
 */
export async function listOrganicCertifications(
    fdm: FdmType,
    principal_id: PrincipalId,
    b_id_farm: schema.farmsTypeInsert["b_id_farm"],
): Promise<OrganicCertification[]> {
    try {
        return await fdm.transaction(async (tx: FdmType) => {
            await checkPermission(
                tx,
                "farm",
                "read",
                b_id_farm,
                principal_id,
                "listOrganicCertifications",
            )

            const holdings = await tx
                .select({
                    b_id_organic:
                        schema.organicCertificationsHolding.b_id_organic,
                })
                .from(schema.organicCertificationsHolding)
                .where(
                    eq(
                        schema.organicCertificationsHolding.b_id_farm,
                        b_id_farm,
                    ),
                )

            if (holdings.length === 0) {
                return []
            }

            const organicIds = holdings.map(
                (holding: { b_id_organic: string }) => holding.b_id_organic,
            )

            return await tx
                .select()
                .from(schema.organicCertifications)
                .where(
                    inArray(
                        schema.organicCertifications.b_id_organic,
                        organicIds,
                    ),
                )
        })
    } catch (err) {
        throw handleError(err, "Exception for listOrganicCertifications", {
            b_id_farm,
        })
    }
}

/**
 * Retrieves a single organic certification by its unique identifier.
 *
 * @param fdm The FDM instance for database access.
 * @param principal_id The identifier of the principal making the request.
 * @param b_id_organic The unique identifier of the organic certification.
 * @returns A promise that resolves to an `OrganicCertification` object, or `undefined` if not found.
 * @throws An error if the principal does not have permission.
 */
export async function getOrganicCertification(
    fdm: FdmType,
    principal_id: PrincipalId,
    b_id_organic: schema.organicCertificationsTypeSelect["b_id_organic"],
): Promise<OrganicCertification | undefined> {
    try {
        return await fdm.transaction(async (tx: FdmType) => {
            const holding = await tx
                .select({
                    b_id_farm: schema.organicCertificationsHolding.b_id_farm,
                })
                .from(schema.organicCertificationsHolding)
                .where(
                    eq(
                        schema.organicCertificationsHolding.b_id_organic,
                        b_id_organic,
                    ),
                )
                .limit(1)

            if (!holding[0]) {
                return undefined // Certification not linked to any farm or does not exist
            }

            await checkPermission(
                tx,
                "farm",
                "read",
                holding[0].b_id_farm,
                principal_id,
                "getOrganicCertification",
            )

            const certification = await tx
                .select()
                .from(schema.organicCertifications)
                .where(
                    eq(schema.organicCertifications.b_id_organic, b_id_organic),
                )
                .limit(1)

            return certification[0]
        })
    } catch (err) {
        throw handleError(err, "Exception for getOrganicCertification", {
            b_id_organic,
        })
    }
}

/**
 * Checks if a farm has a valid organic certification on a given date.
 *
 * @param fdm The FDM instance for database access.
 * @param principal_id The identifier of the principal making the request.
 * @param b_id_farm The unique identifier of the farm.
 * @param date The date to check.
 * @returns A promise that resolves to `true` if a valid certification exists, otherwise `false`.
 * @throws An error if the principal does not have permission.
 */
export async function isOrganicCertificationValid(
    fdm: FdmType,
    principal_id: PrincipalId,
    b_id_farm: schema.farmsTypeInsert["b_id_farm"],
    date: Date,
): Promise<boolean> {
    try {
        return await fdm.transaction(async (tx: FdmType) => {
            await checkPermission(
                tx,
                "farm",
                "read",
                b_id_farm,
                principal_id,
                "isOrganicCertificationValid",
            )

            const result = await tx
                .select({ id: schema.organicCertifications.b_id_organic })
                .from(schema.organicCertifications)
                .leftJoin(
                    schema.organicCertificationsHolding,
                    eq(
                        schema.organicCertifications.b_id_organic,
                        schema.organicCertificationsHolding.b_id_organic,
                    ),
                )
                .where(
                    and(
                        eq(
                            schema.organicCertificationsHolding.b_id_farm,
                            b_id_farm,
                        ),
                        lte(
                            schema.organicCertifications.b_organic_issued,
                            date,
                        ),
                        gte(
                            schema.organicCertifications.b_organic_expires,
                            date,
                        ),
                    ),
                )
                .limit(1)

            return result.length > 0
        })
    } catch (err) {
        throw handleError(err, "Exception for isOrganicCertificationValid", {
            b_id_farm,
            date,
        })
    }
}
