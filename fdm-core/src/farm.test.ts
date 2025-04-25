import { beforeAll, describe, expect, inject, it } from "vitest"
import { listPrincipalsForResource } from "./authorization"
import {
    addFarm,
    getFarm,
    getFarms,
    grantRoleToFarm,
    isAllowedToShareFarm,
    listPrincipalsForFarm,
    revokePrincipalFromFarm,
    updateFarm,
    updateRoleOfPrincipalAtFarm,
} from "./farm"
import { createFdmServer } from "./fdm-server"
import type { FdmServerType } from "./fdm-server.d"
import { type BetterAuth, createFdmAuth } from "./authentication"
import { createId } from "./id"
import { getPrincipal } from "./principal"

describe("Farm Functions", () => {
    let fdm: FdmServerType
    let principal_id: string
    let target_username: string
    let b_id_farm: string
    let farmName: string
    let farmBusinessId: string
    let farmAddress: string
    let farmPostalCode: string
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

        // Create principal_id
        const user1 = await fdmAuth.api.signUpEmail({
            headers: undefined,
            body: {
                email: "user10@example.com",
                name: "user10",
                firstname: "user10",
                surname: "user10",
                username: "user10",
                password: "password",
            },
        })
        principal_id = user1.user.id

        // Create target_username
        const user2 = await fdmAuth.api.signUpEmail({
            headers: undefined,
            body: {
                email: "user11@example.com",
                name: "user11",
                firstname: "user11",
                surname: "user11",
                username: "user11",
                password: "password",
            },
        })
        target_username = "user11" // Changed to username

        // Create a test farm
        farmName = "Test Farm"
        farmBusinessId = "123456"
        farmAddress = "123 Farm Lane"
        farmPostalCode = "12345"
        b_id_farm = await addFarm(
            fdm,
            principal_id,
            farmName,
            farmBusinessId,
            farmAddress,
            farmPostalCode,
        )
    })
    describe("getFarm", () => {
        it("should retrieve a farm's details if the principal has read access", async () => {
            const farm = await getFarm(fdm, principal_id, b_id_farm)
            expect(farm).toEqual(
                expect.objectContaining({
                    b_id_farm: b_id_farm,
                    b_name_farm: farmName,
                    b_businessid_farm: farmBusinessId,
                    b_address_farm: farmAddress,
                    b_postalcode_farm: farmPostalCode,
                }),
            )
        })

        it("should throw an error if the principal does not have read access", async () => {
            const other_principal_id = createId()
            await expect(
                getFarm(fdm, other_principal_id, b_id_farm),
            ).rejects.toThrowError(
                "Principal does not have permission to perform this action",
            )
        })

        it("should handle errors during farm retrieval", async () => {
            // Mock the select function to throw an error
            const mockSelect = async () => {
                throw new Error("Database query failed")
            }
            const fdmMock = {
                ...fdm,
                select: mockSelect,
            }
            await expect(
                getFarm(fdmMock, principal_id, b_id_farm),
            ).rejects.toThrowError("Exception for getFarm")
        })
    })

    describe("getFarms", () => {
        it("should retrieve a list of farms accessible by the principal", async () => {
            const farms = await getFarms(fdm, principal_id)
            expect(farms).toBeDefined()
            expect(farms.length).toBeGreaterThanOrEqual(1)
            expect(
                farms.some((farm) => farm.b_id_farm === b_id_farm),
            ).toBeTruthy() // Assert that the test farm is in the list
        })

        it("should handle errors during farm list retrieval", async () => {
            // Mock the listResources function to throw an error
            const mockListResources = async () => {
                throw new Error("Listing resources failed")
            }
            const authorizationMock = {
                ...fdm,
                listResources: mockListResources,
            }
            await expect(
                getFarms(authorizationMock, principal_id),
            ).rejects.toThrowError("Exception for getFarms")
        })
    })

    describe("updateFarm", () => {
        it("should update a farm's details if the principal has write access", async () => {
            const updatedFarmName = "Updated Farm Name"
            const updatedFarmBusinessId = "987654"
            const updatedFarmAddress = "789 Updated Lane"
            const updatedFarmPostalCode = "98765"

            const updatedFarm = await updateFarm(
                fdm,
                principal_id,
                b_id_farm,
                updatedFarmName,
                updatedFarmBusinessId,
                updatedFarmAddress,
                updatedFarmPostalCode,
            )

            expect(updatedFarm).toEqual(
                expect.objectContaining({
                    b_id_farm: b_id_farm,
                    b_name_farm: updatedFarmName,
                    b_businessid_farm: updatedFarmBusinessId,
                    b_address_farm: updatedFarmAddress,
                    b_postalcode_farm: updatedFarmPostalCode,
                }),
            )
        })

        it("should throw an error if the principal does not have write access", async () => {
            const other_principal_id = createId()
            const updatedFarmName = "Updated Farm Name"
            const updatedFarmBusinessId = "987654"
            const updatedFarmAddress = "789 Updated Lane"
            const updatedFarmPostalCode = "98765"

            await expect(
                updateFarm(
                    fdm,
                    other_principal_id,
                    b_id_farm,
                    updatedFarmName,
                    updatedFarmBusinessId,
                    updatedFarmAddress,
                    updatedFarmPostalCode,
                ),
            ).rejects.toThrowError(
                "Principal does not have permission to perform this action",
            )
        })

        it("should handle errors during farm update", async () => {
            // Mock the update function to throw an error
            const mockUpdate = async () => {
                throw new Error("Database update failed")
            }
            const fdmMock = {
                ...fdm,
                update: mockUpdate,
            }

            const updatedFarmName = "Updated Farm Name"
            const updatedFarmBusinessId = "987654"
            const updatedFarmAddress = "789 Updated Lane"
            const updatedFarmPostalCode = "98765"

            await expect(
                updateFarm(
                    fdmMock,
                    principal_id,
                    b_id_farm,
                    updatedFarmName,
                    updatedFarmBusinessId,
                    updatedFarmAddress,
                    updatedFarmPostalCode,
                ),
            ).rejects.toThrowError("Exception for updateFarm")
        })
    })

    describe("grantRoleToFarm", () => {
        it("should grant a role to a principal for a given farm", async () => {
            const target_id = createId()
            await grantRoleToFarm(
                fdm,
                principal_id,
                target_username,
                b_id_farm,
                "advisor",
            )

            const principals = await listPrincipalsForResource(
                fdm,
                "farm",
                b_id_farm,
            )
            const advisor = principals.find((p) => p.principal_id === target_id)

            expect(advisor).toEqual(
                expect.objectContaining({
                    principal_id: target_id,
                    role: "advisor",
                }),
            )
        })

        it("should throw an error if the principal does not have share permission", async () => {
            const other_principal_id = createId()
            await expect(
                grantRoleToFarm(
                    fdm,
                    other_principal_id,
                    target_username,
                    b_id_farm,
                    "advisor",
                ),
            ).rejects.toThrowError(
                "Principal does not have permission to perform this action",
            )
        })

        it("should handle errors during the grant role process", async () => {
            // Mock the checkPermission function to throw an error
            const mockCheckPermission = async () => {
                throw new Error("Permission check failed")
            }
            const fdmMock = {
                ...fdm,
                checkPermission: mockCheckPermission,
            }

            await expect(
                grantRoleToFarm(
                    fdmMock,
                    principal_id,
                    target_username,
                    b_id_farm,
                    "advisor",
                ),
            ).rejects.toThrowError("Exception for grantRoleToFarm")
        })
    })

    describe("updateRoleOfPrincipalAtFarm", () => {
        it("should update a role to a principal for a given farm", async () => {
            const target_id = createId()
            await grantRoleToFarm(
                fdm,
                principal_id,
                target_id,
                b_id_farm,
                "advisor",
            )
            await updateRoleOfPrincipalAtFarm(
                fdm,
                principal_id,
                target_username,
                b_id_farm,
                "researcher",
            )

            const principals = await listPrincipalsForResource(
                fdm,
                "farm",
                b_id_farm,
            )
            const researcher = principals.find((p) => p.role === "researcher")

            expect(researcher).toEqual(
                expect.objectContaining({
                    principal_id: researcher?.principal_id,
                    role: "researcher",
                }),
            )
        })

        it("should throw an error if the principal does not have share permission", async () => {
            const other_principal_id = createId()
            await expect(
                updateRoleOfPrincipalAtFarm(
                    fdm,
                    other_principal_id,
                    target_username,
                    b_id_farm,
                    "researcher",
                ),
            ).rejects.toThrowError(
                "Principal does not have permission to perform this action",
            )
        })

        it("should handle errors during the update role process", async () => {
            // Mock the updateRole function to throw an error
            const mockUpdateRole = async () => {
                throw new Error("Update role failed")
            }
            const fdmMock = {
                ...fdm,
                updateRole: mockUpdateRole,
            }
            await grantRoleToFarm(
                fdm,
                principal_id,
                target_username,
                b_id_farm,
                "advisor",
            )

            await expect(
                updateRoleOfPrincipalAtFarm(
                    fdmMock,
                    principal_id,
                    target_username,
                    b_id_farm,
                    "researcher",
                ),
            ).rejects.toThrowError("Exception for updateRoleOfPrincipalAtFarm")
        })
    })

    describe("revokePrincipalFromFarm", () => {
        it("should revoke a principal from a given farm", async () => {
            await grantRoleToFarm(
                fdm,
                principal_id,
                target_username,
                b_id_farm,
                "advisor",
            )
            await revokePrincipalFromFarm(
                fdm,
                principal_id,
                target_username,
                b_id_farm,
            )

            const targetPrincipal = await getPrincipal(fdm, target_username)

            const principals = await listPrincipalsForResource(
                fdm,
                "farm",
                b_id_farm,
            )
            const revokee = principals.find(
                (p) => p.principal_id === targetPrincipal?.id,
            )

            expect(revokee).toBeUndefined()
        })

        it("should throw an error if the principal does not have share permission", async () => {
            const other_principal_id = createId()
            await expect(
                revokePrincipalFromFarm(
                    fdm,
                    other_principal_id,
                    target_username,
                    b_id_farm,
                ),
            ).rejects.toThrowError(
                "Principal does not have permission to perform this action",
            )
        })

        it("should handle errors during the revoke principal process", async () => {
            await grantRoleToFarm(
                fdm,
                principal_id,
                target_username,
                b_id_farm,
                "advisor",
            )
            // Mock the revokePrincipal function to throw an error
            const mockRevokePrincipal = async () => {
                throw new Error("Revoke principal failed")
            }
            const fdmMock = {
                ...fdm,
                revokePrincipal: mockRevokePrincipal,
            }
            await grantRoleToFarm(
                fdm,
                principal_id,
                target_username,
                b_id_farm,
                "advisor",
            )

            await expect(
                revokePrincipalFromFarm(
                    fdmMock,
                    principal_id,
                    target_username,
                    b_id_farm,
                ),
            ).rejects.toThrowError("Exception for revokePrincipalFromFarm")
        })
    })

    describe("listPrincipalsForFarm", () => {
        it("should list principals associated with a farm", async () => {
            await grantRoleToFarm(
                fdm,
                principal_id,
                target_username,
                b_id_farm,
                "advisor",
            )

            const principals = await listPrincipalsForFarm(
                fdm,
                principal_id,
                b_id_farm,
            )
            expect(principals).toBeDefined()
            expect(principals.length).toBeGreaterThanOrEqual(1)

            const ownerPrincipal = await getPrincipal(fdm, principal_id)
            const targetPrincipal = await getPrincipal(fdm, target_username)

            const owner = principals.find(
                (p) => p?.username === ownerPrincipal?.username,
            )
            expect(owner).toBeDefined()
            expect(owner?.username).toBe(ownerPrincipal?.username)
            expect(owner?.type).toBe(ownerPrincipal?.type)
            expect(owner?.isVerified).toBe(ownerPrincipal?.isVerified)

            const advisor = principals.find(
                (p) => p?.username === targetPrincipal?.username,
            )
            expect(advisor).toBeDefined()
            expect(advisor?.username).toBe(targetPrincipal?.username)
            expect(advisor?.type).toBe(targetPrincipal?.type)
            expect(advisor?.isVerified).toBe(targetPrincipal?.isVerified)
        })

        it("should handle errors during the list principals process", async () => {
            // Mock the listPrincipalsForResource function to throw an error
            const mockListPrincipalsForResource = async () => {
                throw new Error("Listing principals failed")
            }
            const fdmMock = {
                ...fdm,
                listPrincipalsForResource: mockListPrincipalsForResource,
            }

            await expect(
                listPrincipalsForFarm(fdmMock, principal_id, b_id_farm),
            ).rejects.toThrowError("Exception for listPrincipalsForFarm")
        })

        it("should throw an error if the principal does not have read access", async () => {
            const other_principal_id = createId()
            await expect(
                listPrincipalsForFarm(fdm, other_principal_id, b_id_farm),
            ).rejects.toThrowError(
                "Principal does not have permission to perform this action",
            )
        })
    })

    describe("isAllowedToShareFarm", () => {
        it("should return true if principal is allowed to share the farm", async () => {
            const isAllowed = await isAllowedToShareFarm(
                fdm,
                principal_id,
                b_id_farm,
            )
            expect(isAllowed).toBe(true)
        })

        it("should return false if principal is not allowed to share the farm", async () => {
            const other_principal_id = createId()
            // Mock the checkPermission function to throw an error (simulating no share permission)
            const mockCheckPermission = async () => {
                throw new Error("Permission check failed")
            }
            const fdmMock = {
                ...fdm,
                checkPermission: mockCheckPermission,
            }
            const isAllowed = await isAllowedToShareFarm(
                fdmMock,
                other_principal_id,
                b_id_farm,
            )
            expect(isAllowed).toBe(false)
        })
    })
})
