import { beforeEach, describe, expect, it } from "vitest"
import { addFarm } from "./farm"
import { createFdmServer, migrateFdmServer } from "./fdm-server"
import type { FdmServerType } from "./fdm-server.d"
import { addField, getField, getFields, updateField } from "./field"

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

    describe("Field CRUD", () => {
        it("should add a new field", async () => {
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

            const fieldName = "Test Field"
            const fieldIDSource = "test-field-id"
            const fieldGeometry = "POLYGON((30 10,40 40,20 40,10 20,30 10))"
            const manageStart = "2023-01-01"
            const manageEnd = "2023-12-31"
            const manageType = "owner"
            const b_id = await addField(
                fdm,
                b_id_farm,
                fieldName,
                fieldIDSource,
                fieldGeometry,
                manageStart,
                manageEnd,
                manageType,
            )
            expect(b_id).toBeDefined()

            const field = await getField(fdm, b_id)
            expect(field.b_name).toBe(fieldName)
            expect(field.b_id_farm).toBe(b_id_farm)
            expect(field.b_id_source).toBe(fieldIDSource)
            expect(field.b_geometry).toBe(fieldGeometry)
            expect(field.b_area).toBeGreaterThan(0)
            expect(field.b_manage_start).toEqual(manageStart)
            expect(field.b_manage_end).toEqual(manageEnd)
            expect(field.b_manage_type).toBe(manageType)
        })

        it("should get a field by ID", async () => {
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

            const fieldName = "Test Field"
            const fieldIDSource = "test-field-id"
            const fieldGeometry = "POLYGON((30 10,40 40,20 40,10 20,30 10))"
            const manageStart = "2023-01-01"
            const manageEnd = "2023-12-31"
            const manageType = "owner"
            const b_id = await addField(
                fdm,
                b_id_farm,
                fieldName,
                fieldIDSource,
                fieldGeometry,
                manageStart,
                manageEnd,
                manageType,
            )

            const field = await getField(fdm, b_id)
            expect(field.b_name).toBe(fieldName)
            expect(field.b_id_farm).toBe(b_id_farm)
            expect(field.b_id_source).toBe(fieldIDSource)
            expect(field.b_geometry).toBe(fieldGeometry)
            expect(field.b_area).toBeGreaterThan(0)
            expect(field.b_manage_start).toEqual(manageStart)
            expect(field.b_manage_end).toEqual(manageEnd)
            expect(field.b_manage_type).toBe(manageType)
        })

        it("should get fields by farm ID", async () => {
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

            const fieldName1 = "Test Field 1"
            const fieldIDSource1 = "test-field-id-1"
            const fieldGeometry1 = "POLYGON((30 10,40 40,20 40,10 20,30 10))"
            const manageStart1 = "2023-01-01"
            const manageEnd1 = "2023-12-31"
            const manageType1 = "owner"
            const b_id1 = await addField(
                fdm,
                b_id_farm,
                fieldName1,
                fieldIDSource1,
                fieldGeometry1,
                manageStart1,
                manageEnd1,
                manageType1,
            )

            const fieldName2 = "Test Field 2"
            const fieldIDSource2 = "test-field-id-2"
            const fieldGeometry2 = "POLYGON((50 50,60 60,40 60,30 40,50 50))"
            const manageStart2 = "2024-01-01"
            const manageEnd2 = "2024-12-31"
            const manageType2 = "lease"
            const b_id2 = await addField(
                fdm,
                b_id_farm,
                fieldName2,
                fieldIDSource2,
                fieldGeometry2,
                manageStart2,
                manageEnd2,
                manageType2,
            )

            const fields = await getFields(fdm, b_id_farm)
            expect(fields.length).toBe(2)

            const field1 = fields.find((field) => field.b_id === b_id1)
            expect(field1?.b_name).toBe(fieldName1)
            expect(field1?.b_id_farm).toBe(b_id_farm)
            expect(field1?.b_id_source).toBe(fieldIDSource1)
            expect(field1?.b_geometry).toBe(fieldGeometry1)
            expect(field1?.b_area).toBeGreaterThan(0)
            expect(field1?.b_manage_start).toEqual(manageStart1)
            expect(field1?.b_manage_end).toEqual(manageEnd1)
            expect(field1?.b_manage_type).toBe(manageType1)

            const field2 = fields.find((field) => field.b_id === b_id2)
            expect(field2?.b_name).toBe(fieldName2)
            expect(field2?.b_id_farm).toBe(b_id_farm)
            expect(field2?.b_id_source).toBe(fieldIDSource2)
            expect(field2?.b_geometry).toBe(fieldGeometry2)
            expect(field2?.b_area).toBeGreaterThan(0)
            expect(field2?.b_manage_start).toEqual(manageStart2)
            expect(field2?.b_manage_end).toEqual(manageEnd2)
            expect(field2?.b_manage_type).toBe(manageType2)
        })

        it("should update a field", async () => {
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

            const fieldName = "Test Field"
            const fieldIDSource = "test-field-id"
            const fieldGeometry = "POLYGON((30 10,40 40,20 40,10 20,30 10))"
            const manageStart = "2023-01-01"
            const manageEnd = "2023-12-31"
            const manageType = "owner"
            const b_id = await addField(
                fdm,
                b_id_farm,
                fieldName,
                fieldIDSource,
                fieldGeometry,
                manageStart,
                manageEnd,
                manageType,
            )

            const updatedFieldName = "Updated Test Field"
            const updatedFieldIDSource = "updated-test-field-id"
            const updatedFieldGeometry =
                "POLYGON((30 10,40 40,20 40,10 20,30 10))"
            const updatedManageStart = "2024-01-01"
            const updatedManageEnd = "2024-12-31"
            const updatedManageType = "lease"
            const updatedField = await updateField(
                fdm,
                b_id,
                updatedFieldName,
                updatedFieldIDSource,
                updatedFieldGeometry,
                updatedManageStart,
                updatedManageEnd,
                updatedManageType,
            )
            expect(updatedField.b_name).toBe(updatedFieldName)
            expect(updatedField.b_id_source).toBe(updatedFieldIDSource)
            expect(updatedField.b_geometry).toBe(fieldGeometry)
            expect(updatedField.b_manage_start).toEqual(updatedManageStart)
            expect(updatedField.b_manage_end).toEqual(updatedManageEnd)
            expect(updatedField.b_manage_type).toBe(updatedManageType)
        })

        it("should update a field partially", async () => {
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

            const fieldName = "Test Field"
            const fieldIDSource = "test-field-id"
            const fieldGeometry = "POLYGON((30 10,40 40,20 40,10 20,30 10))"
            const manageStart = "2023-01-01"
            const manageEnd = "2023-12-31"
            const manageType = "owner"
            const b_id = await addField(
                fdm,
                b_id_farm,
                fieldName,
                fieldIDSource,
                fieldGeometry,
                manageStart,
                manageEnd,
                manageType,
            )

            // Update only the name
            const updatedFieldName = "Updated Test Field"
            const updatedField = await updateField(
                fdm,
                b_id,
                updatedFieldName,
                undefined,
                undefined,
                undefined,
                undefined,
                undefined,
            )

            expect(updatedField.b_name).toBe(updatedFieldName)
            expect(updatedField.b_id_source).toBe(fieldIDSource) // Should remain the same
            expect(updatedField.b_geometry).toBe(fieldGeometry) // Should remain the same
            expect(updatedField.b_manage_start).toEqual(manageStart) // Should remain the same
            expect(updatedField.b_manage_end).toEqual(manageEnd) // Should remain the same
            expect(updatedField.b_manage_type).toBe(manageType) // Should remain the same

            // Update only the manage type
            const updatedManageType = "lease"
            const updatedField2 = await updateField(
                fdm,
                b_id,
                undefined,
                undefined,
                undefined,
                undefined,
                undefined,
                updatedManageType,
            )
            expect(updatedField2.b_name).toBe(updatedFieldName) // Should remain the same
            expect(updatedField2.b_id_source).toBe(fieldIDSource) // Should remain the same
            expect(updatedField2.b_geometry).toBe(fieldGeometry) // Should remain the same
            expect(updatedField2.b_manage_start).toEqual(manageStart) // Should remain the same
            expect(updatedField2.b_manage_end).toEqual(manageEnd) // Should remain the same
            expect(updatedField2.b_manage_type).toBe(updatedManageType) // Should be updated

            //Partial updates for `fields` table
            const updatedFieldIDSource = "updated-test-field-id"
            const updatedField3 = await updateField(
                fdm,
                b_id,
                undefined,
                updatedFieldIDSource,
                undefined,
                undefined,
                undefined,
                undefined,
            )
            expect(updatedField3.b_name).toBe(updatedFieldName) // Should remain the same
            expect(updatedField3.b_id_source).toBe(updatedFieldIDSource) // Should be updated
            expect(updatedField3.b_geometry).toBe(fieldGeometry) // Should remain the same
            expect(updatedField3.b_manage_start).toEqual(manageStart) // Should remain the same
            expect(updatedField3.b_manage_end).toEqual(manageEnd) // Should remain the same
            expect(updatedField3.b_manage_type).toBe(updatedManageType) // Should remain the same

            // Partial updates for `farmManaging` table
            const updatedManageStart = "2024-01-01"
            const updatedField4 = await updateField(
                fdm,
                b_id,
                undefined,
                undefined,
                undefined,
                updatedManageStart,
                undefined,
                undefined,
            )
            expect(updatedField4.b_name).toBe(updatedFieldName) // Should remain the same
            expect(updatedField4.b_id_source).toBe(updatedFieldIDSource) // Should remain the same
            expect(updatedField4.b_geometry).toBe(fieldGeometry) // Should remain the same
            expect(updatedField4.b_manage_start).toEqual(updatedManageStart) // Should be updated
            expect(updatedField4.b_manage_end).toEqual(manageEnd) // Should remain the same
            expect(updatedField4.b_manage_type).toBe(updatedManageType) // Should remain the same
        })
    })
})
