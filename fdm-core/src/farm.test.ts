import { beforeEach, describe, expect, inject, it } from "vitest"
import { addFarm, getFarm, getFarms, updateFarm } from "./farm"
import type { FdmServerType } from "./fdm-server.d"
import { createFdmServer } from "./fdm-server"

describe("Farm Data Model", () => {
    let fdm: FdmServerType

    beforeEach(async () => {
        const host = inject("host")
        const port = inject("port")
        const user = inject("user")
        const password = inject("password")
        const database = inject("database")
        fdm = createFdmServer(host, port, user, password, database)
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
            )
            expect(b_id_farm).toBeDefined()

            const farm = await getFarm(fdm, b_id_farm)
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
            )

            const farm = await getFarm(fdm, b_id_farm)
            expect(farm).toBeDefined()
            expect(farm.b_id_farm).toBe(b_id_farm)
        })

        it("should get a list of farms", async () => {
            const farms = await getFarms(fdm)
            expect(farms).toBeDefined()
            expect(farms.length).toBeGreaterThanOrEqual(1) // At least 1 farm should exist
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
            )
            expect(updatedFarm.b_name_farm).toBe(updatedFarmName)
            expect(updatedFarm.b_businessid_farm).toBe(updatedFarmBusinessId)
            expect(updatedFarm.b_address_farm).toBe(updatedFarmAddress)
            expect(updatedFarm.b_postalcode_farm).toBe(updatedFarmPostalCode)
        })
    })
})
