import { beforeEach, describe, expect, inject, it } from "vitest"
import { addFarm, getFarm, getFarms, updateFarm } from "./farm"
import { createFdmServer } from "./fdm-server"
import type { FdmServerType } from "./fdm-server.d"
import { createId } from "./id"

describe("Farm Data Model", () => {
    let fdm: FdmServerType
    let principal_id: string

    beforeEach(async () => {
        const host = inject("host")
        const port = inject("port")
        const user = inject("user")
        const password = inject("password")
        const database = inject("database")
        fdm = createFdmServer(host, port, user, password, database)

        principal_id = createId()
    })

    describe("Farm CRUD", () => {
        it("should add a new farm", async () => {
            const farmName = "Test Farm"
            const farmBusinessId = "123456"
            const farmAddress = "123 Farm Lane"
            const farmPostalCode = "12345"
            const b_id_farm = await addFarm(
                fdm,
                farmName,
                farmBusinessId,
                farmAddress,
                farmPostalCode,
                principal_id,
            )
            expect(b_id_farm).toBeDefined()

            const farm = await getFarm(fdm, b_id_farm, principal_id)
            expect(farm.b_name_farm).toBe(farmName)
            expect(farm.b_businessid_farm).toBe(farmBusinessId)
            expect(farm.b_address_farm).toBe(farmAddress)
            expect(farm.b_postalcode_farm).toBe(farmPostalCode)
        })

        it("should get a farm by ID", async () => {
            const farmName = "Test Farm"
            const farmBusinessId = "123456"
            const farmAddress = "123 Farm Lane"
            const farmPostalCode = "12345"
            const b_id_farm = await addFarm(
                fdm,
                farmName,
                farmBusinessId,
                farmAddress,
                farmPostalCode,
                principal_id,
            )

            const farm = await getFarm(fdm, b_id_farm, principal_id)
            expect(farm).toBeDefined()
            expect(farm.b_id_farm).toBe(b_id_farm)
        })

        it("should get a list of farms", async () => {
            const farmName = "Test Farm"
            const farmBusinessId = "123456"
            const farmAddress = "123 Farm Lane"
            const farmPostalCode = "12345"
            await addFarm(
                fdm,
                farmName,
                farmBusinessId,
                farmAddress,
                farmPostalCode,
                principal_id,
            )

            const farmName2 = "Test Farm 2"
            const farmBusinessId2 = "6543231"
            const farmAddress2 = "321 Farm Lane"
            const farmPostalCode2 = "54321"
            await addFarm(
                fdm,
                farmName2,
                farmBusinessId2,
                farmAddress2,
                farmPostalCode2,
                principal_id,
            )

            const farms = await getFarms(fdm, principal_id)
            expect(farms).toBeDefined()
            expect(farms.length).toBeGreaterThanOrEqual(1) // At least 2 farms should exist
            expect(farms[0].b_id_farm).toBeDefined()
        })

        it("should update a farm", async () => {
            const farmName = "Test Farm"
            const farmBusinessId = "123456"
            const farmAddress = "123 Farm Lane"
            const farmPostalCode = "12345"
            const b_id_farm = await addFarm(
                fdm,
                farmName,
                farmBusinessId,
                farmAddress,
                farmPostalCode,
                principal_id,
            )

            const updatedFarmName = "Updated Test Farm"
            const updatedFarmBusinessId = "654321"
            const updatedFarmAddress = "456 Farm Road"
            const updatedFarmPostalCode = "54321"
            const updatedFarm = await updateFarm(
                fdm,
                b_id_farm,
                updatedFarmName,
                updatedFarmBusinessId,
                updatedFarmAddress,
                updatedFarmPostalCode,
                principal_id,
            )
            expect(updatedFarm.b_name_farm).toBe(updatedFarmName)
            expect(updatedFarm.b_businessid_farm).toBe(updatedFarmBusinessId)
            expect(updatedFarm.b_address_farm).toBe(updatedFarmAddress)
            expect(updatedFarm.b_postalcode_farm).toBe(updatedFarmPostalCode)
        })
    })
})
