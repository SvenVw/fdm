import { beforeEach, describe, expect, inject, it } from "vitest"
import type * as schema from "./db/schema"
import { addFarm } from "./farm"
import { createFdmServer } from "./fdm-server"
import type { FdmServerType } from "./fdm-server.d"
import { addField, getField, getFields, updateField } from "./field"
import { createId } from "./id"

type Polygon = schema.fieldsTypeInsert["b_geometry"]

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

    describe("Field CRUD", () => {
        it("should add a new field", async () => {
            const farmName = "Test Farm"
            const farmBusinessId = "123456"
            const farmAddress = "123 Farm Lane"
            const farmPostalCode = "12345"
            const b_id_farm = await addFarm(
                fdm,
                principal_id,
                farmName,
                farmBusinessId,
                farmAddress,
                farmPostalCode,   
            )

            const fieldName = "Test Field"
            const fieldIDSource = "test-field-id"
            const fieldGeometry: Polygon = {
                type: "Polygon",
                coordinates: [
                    [
                        [30, 10],
                        [40, 40],
                        [20, 40],
                        [10, 20],
                        [30, 10],
                    ],
                ],
            }
            const AcquireDate = new Date("2023-01-01")
            const discardingDate = new Date("2023-12-31")
            const AcquiringMethod = "owner"
            const b_id = await addField(
                fdm,
                principal_id,
                b_id_farm,
                fieldName,
                fieldIDSource,
                fieldGeometry,
                AcquireDate,
                AcquiringMethod,
                discardingDate,
            )
            expect(b_id).toBeDefined()

            const field = await getField(fdm, principal_id, b_id)
            expect(field.b_name).toBe(fieldName)
            expect(field.b_id_farm).toBe(b_id_farm)
            expect(field.b_id_source).toBe(fieldIDSource)
            expect(field.b_geometry).toStrictEqual(fieldGeometry)
            expect(field.b_area).toBeGreaterThan(0)
            expect(field.b_acquiring_date).toEqual(AcquireDate)
            expect(field.b_discarding_date).toEqual(discardingDate)
            expect(field.b_acquiring_method).toBe(AcquiringMethod)
        })

        it("should get a field by ID", async () => {
            const farmName = "Test Farm"
            const farmBusinessId = "123456"
            const farmAddress = "123 Farm Lane"
            const farmPostalCode = "12345"
            const b_id_farm = await addFarm(
                fdm,
                principal_id,
                farmName,
                farmBusinessId,
                farmAddress,
                farmPostalCode,         
            )

            const fieldName = "Test Field"
            const fieldIDSource = "test-field-id"
            const fieldGeometry: Polygon = {
                type: "Polygon",
                coordinates: [
                    [
                        [30, 10],
                        [40, 40],
                        [20, 40],
                        [10, 20],
                        [30, 10],
                    ],
                ],
            }
            const AcquireDate = new Date("2023-01-01")
            const discardingDate = new Date("2023-12-31")
            const AcquiringMethod = "owner"
            const b_id = await addField(
                fdm,
                principal_id,
                b_id_farm,
                fieldName,
                fieldIDSource,
                fieldGeometry,
                AcquireDate,
                AcquiringMethod,
                discardingDate,
            )

            const field = await getField(fdm, principal_id, b_id)
            expect(field.b_name).toBe(fieldName)
            expect(field.b_id_farm).toBe(b_id_farm)
            expect(field.b_id_source).toBe(fieldIDSource)
            expect(field.b_geometry).toStrictEqual(fieldGeometry)
            expect(field.b_area).toBeGreaterThan(0)
            expect(field.b_acquiring_date).toEqual(AcquireDate)
            expect(field.b_discarding_date).toEqual(discardingDate)
            expect(field.b_acquiring_method).toBe(AcquiringMethod)
        })

        it("should get fields by farm ID", async () => {
            const farmName = "Test Farm"
            const farmBusinessId = "123456"
            const farmAddress = "123 Farm Lane"
            const farmPostalCode = "12345"
            const b_id_farm = await addFarm(
                fdm,
                principal_id,
                farmName,
                farmBusinessId,
                farmAddress,
                farmPostalCode,
            )

            const fieldName1 = "Test Field 1"
            const fieldIDSource1 = "test-field-id-1"
            const fieldGeometry1: Polygon = {
                type: "Polygon",
                coordinates: [
                    [
                        [30, 10],
                        [40, 40],
                        [20, 40],
                        [10, 20],
                        [30, 10],
                    ],
                ],
            }

            const AcquireDate1 = new Date("2023-01-01")
            const discardingDate1 = new Date("2023-12-31")
            const AcquiringMethod1 = "owner"
            const b_id1 = await addField(
                fdm,
                principal_id,
                b_id_farm,
                fieldName1,
                fieldIDSource1,
                fieldGeometry1,
                AcquireDate1,
                AcquiringMethod1,
                discardingDate1,
            )

            const fieldName2 = "Test Field 2"
            const fieldIDSource2 = "test-field-id-2"
            const fieldGeometry2: Polygon = {
                type: "Polygon",
                coordinates: [
                    [
                        [50, 50],
                        [60, 60],
                        [40, 60],
                        [30, 40],
                        [50, 50],
                    ],
                ],
            }
            const AcquireDate2 = new Date("2024-01-01")
            const discardingDate2 = new Date("2024-12-31")
            const AcquiringMethod2 = "lease"
            const b_id2 = await addField(
                fdm,
                principal_id,
                b_id_farm,
                fieldName2,
                fieldIDSource2,
                fieldGeometry2,
                AcquireDate2,
                AcquiringMethod2,
                discardingDate2,
            )

            const fields = await getFields(fdm, principal_id, b_id_farm)
            expect(fields.length).toBe(2)

            const field1 = fields.find((field) => field.b_id === b_id1)
            expect(field1?.b_name).toBe(fieldName1)
            expect(field1?.b_id_farm).toBe(b_id_farm)
            expect(field1?.b_id_source).toBe(fieldIDSource1)
            expect(field1?.b_geometry).toStrictEqual(fieldGeometry1)
            expect(field1?.b_area).toBeGreaterThan(0)
            expect(field1?.b_acquiring_date).toEqual(AcquireDate1)
            expect(field1?.b_discarding_date).toEqual(discardingDate1)
            expect(field1?.b_acquiring_method).toBe(AcquiringMethod1)

            const field2 = fields.find((field) => field.b_id === b_id2)
            expect(field2?.b_name).toBe(fieldName2)
            expect(field2?.b_id_farm).toBe(b_id_farm)
            expect(field2?.b_id_source).toBe(fieldIDSource2)
            expect(field2?.b_geometry).toStrictEqual(fieldGeometry2)
            expect(field2?.b_area).toBeGreaterThan(0)
            expect(field2?.b_acquiring_date).toEqual(AcquireDate2)
            expect(field2?.b_discarding_date).toEqual(discardingDate2)
            expect(field2?.b_acquiring_method).toBe(AcquiringMethod2)
        })

        it("should update a field", async () => {
            const farmName = "Test Farm"
            const farmBusinessId = "123456"
            const farmAddress = "123 Farm Lane"
            const farmPostalCode = "12345"
            const b_id_farm = await addFarm(
                fdm,
                principal_id,
                farmName,
                farmBusinessId,
                farmAddress,
                farmPostalCode,             
            )

            const fieldName = "Test Field"
            const fieldIDSource = "test-field-id"
            const fieldGeometry: Polygon = {
                type: "Polygon",
                coordinates: [
                    [
                        [30, 10],
                        [40, 40],
                        [20, 40],
                        [10, 20],
                        [30, 10],
                    ],
                ],
            }
            const AcquireDate = new Date("2023-01-01")
            const discardingDate = new Date("2023-12-31")
            const AcquiringMethod = "owner"
            const b_id = await addField(
                fdm,
                principal_id,
                b_id_farm,
                fieldName,
                fieldIDSource,
                fieldGeometry,
                AcquireDate,
                AcquiringMethod,
                discardingDate,
            )

            const updatedFieldName = "Updated Test Field"
            const updatedFieldIDSource = "updated-test-field-id"
            const updatedFieldGeometry: Polygon = {
                type: "Polygon",
                coordinates: [
                    [
                        [30, 10],
                        [40, 40],
                        [20, 40],
                        [10, 20],
                        [35, 10],
                    ],
                ],
            }
            const updatedAcquireDate = new Date("2024-01-01")
            const updatedDiscardingDate = new Date("2024-12-31")
            const updatedAcquiringMethod = "lease"
            const updatedField = await updateField(
                fdm,
                principal_id,
                b_id,
                updatedFieldName,
                updatedFieldIDSource,
                updatedFieldGeometry,
                updatedAcquireDate,
                updatedAcquiringMethod,
                updatedDiscardingDate,
            )
            expect(updatedField.b_name).toBe(updatedFieldName)
            expect(updatedField.b_id_source).toBe(updatedFieldIDSource)
            expect(updatedField.b_geometry).toStrictEqual(updatedFieldGeometry)
            expect(updatedField.b_acquiring_date).toEqual(updatedAcquireDate)
            expect(updatedField.b_discarding_date).toEqual(
                updatedDiscardingDate,
            )
            expect(updatedField.b_acquiring_method).toBe(updatedAcquiringMethod)
        })

        it("should update a field partially", async () => {
            const farmName = "Test Farm"
            const farmBusinessId = "123456"
            const farmAddress = "123 Farm Lane"
            const farmPostalCode = "12345"
            const b_id_farm = await addFarm(
                fdm,
                principal_id,
                farmName,
                farmBusinessId,
                farmAddress,
                farmPostalCode,       
            )

            const fieldName = "Test Field"
            const fieldIDSource = "test-field-id"
            const fieldGeometry: Polygon = {
                type: "Polygon",
                coordinates: [
                    [
                        [30, 10],
                        [40, 40],
                        [20, 40],
                        [10, 20],
                        [30, 10],
                    ],
                ],
            }
            const AcquireDate = new Date("2023-01-01")
            const discardingDate = new Date("2023-12-31")
            const AcquiringMethod = "owner"
            const b_id = await addField(
                fdm,
                principal_id,
                b_id_farm,
                fieldName,
                fieldIDSource,
                fieldGeometry,
                AcquireDate,
                AcquiringMethod,
                discardingDate,
            )

            // Update only the name
            const updatedFieldName = "Updated Test Field"
            const updatedField = await updateField(
                fdm,
                principal_id,
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
            expect(updatedField.b_geometry).toStrictEqual(fieldGeometry) // Should remain the same
            expect(updatedField.b_acquiring_date).toEqual(AcquireDate) // Should remain the same
            expect(updatedField.b_discarding_date).toEqual(discardingDate) // Should remain the same
            expect(updatedField.b_acquiring_method).toBe(AcquiringMethod) // Should remain the same

            // Update only the manage type
            const updatedAcquiringMethod = "lease"
            const updatedField2 = await updateField(
                fdm,
                principal_id,
                b_id,
                undefined,
                undefined,
                undefined,
                undefined,
                updatedAcquiringMethod,
                undefined,
            )
            expect(updatedField2.b_name).toBe(updatedFieldName) // Should remain the same
            expect(updatedField2.b_id_source).toBe(fieldIDSource) // Should remain the same
            expect(updatedField2.b_geometry).toStrictEqual(fieldGeometry) // Should remain the same
            expect(updatedField2.b_acquiring_date).toEqual(AcquireDate) // Should remain the same
            expect(updatedField2.b_discarding_date).toEqual(discardingDate) // Should remain the same
            expect(updatedField2.b_acquiring_method).toBe(
                updatedAcquiringMethod,
            ) // Should be updated

            //Partial updates for `fields` table
            const updatedFieldIDSource = "updated-test-field-id"
            const updatedField3 = await updateField(
                fdm,
                principal_id,
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
            expect(updatedField3.b_geometry).toStrictEqual(fieldGeometry) // Should remain the same
            expect(updatedField3.b_acquiring_date).toEqual(AcquireDate) // Should remain the same
            expect(updatedField3.b_discarding_date).toEqual(discardingDate) // Should remain the same
            expect(updatedField3.b_acquiring_method).toBe(
                updatedAcquiringMethod,
            ) // Should remain the same

            // Partial updates for `farmManaging` table
            const updatedAcquireDate = new Date("2023-02-01")
            const updatedField4 = await updateField(
                fdm,
                principal_id,
                b_id,
                undefined,
                undefined,
                undefined,
                updatedAcquireDate,
                undefined,
                undefined,
            )
            expect(updatedField4.b_name).toBe(updatedFieldName) // Should remain the same
            expect(updatedField4.b_id_source).toBe(updatedFieldIDSource) // Should remain the same
            expect(updatedField4.b_geometry).toStrictEqual(fieldGeometry) // Should remain the same
            expect(updatedField4.b_acquiring_date).toEqual(updatedAcquireDate) // Should be updated
            expect(updatedField4.b_discarding_date).toEqual(discardingDate) // Should remain the same
            expect(updatedField4.b_acquiring_method).toBe(
                updatedAcquiringMethod,
            ) // Should remain the same
        })
    })
})
