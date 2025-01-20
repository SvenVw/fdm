import { beforeEach, describe, expect, it } from "vitest"
import { addFarm, getFarm, getFarms, updateFarm } from "./farm"
import { createFdmServer, migrateFdmServer } from "./fdm-server"
import type { FdmServerType } from "./fdm-server.d"

describe("Farm Data Model", () => {
    let fdm: FdmServerType

    beforeEach(async () => {
        const host = process.env.POSTGRES_HOST
        const port = Number(process.env.POSTGRES_PORT)
        const user = process.env.POSTGRES_USER
        const password = process.env.POSTGRES_PASSWORD
        const database = process.env.POSTGRES_DB
        const migrationsFolderPath = "src/db/migrations"

        fdm = await createFdmServer(host, port, user, password, database)

        await migrateFdmServer(fdm, migrationsFolderPath)
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
