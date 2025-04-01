import { beforeEach, describe, expect, inject, it } from "vitest"
import type * as schema from "./db/schema"
import { addFarm } from "./farm"
import { createFdmServer } from "./fdm-server"
import type { FdmServerType } from "./fdm-server.d"
import { addField, getField, getFields, updateField } from "./field"
import { createId } from "./id"
import type { FdmType } from "./fdm"

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
            expect(field.b_start).toEqual(AcquireDate)
            expect(field.b_end).toEqual(discardingDate)
            expect(field.b_acquiring_method).toBe(AcquiringMethod)
        })

        describe("getFields", () => {
            let fdm: FdmType
            let principal_id: string
            let b_id_farm: string

            beforeEach(async () => {
                const host = inject("host")
                const port = inject("port")
                const user = inject("user")
                const password = inject("password")
                const database = inject("database")
                fdm = createFdmServer(host, port, user, password, database)
                principal_id = "test_principal"

                // Create a test farm
                const farmName = "Test Farm"
                const farmBusinessId = "123456"
                const farmAddress = "123 Farm Lane"
                const farmPostalCode = "12345"
                b_id_farm = await addFarm(
                    fdm,
                    principal_id,
                    farmName,
                    farmBusinessId,
                    farmAddress,
                    farmPostalCode,
                )
            })
            it("should get fields by farm ID", async () => {
                // Add two fields to the farm
                const field1Name = "Field 1"
                const field1Source = "source1"
                const field1Geometry = {
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
                const field1Start = new Date("2023-01-01")
                const field1AcquiringMethod = "owner"
                await addField(
                    fdm,
                    principal_id,
                    b_id_farm,
                    field1Name,
                    field1Source,
                    field1Geometry,
                    field1Start,
                    field1AcquiringMethod,
                )

                const field2Name = "Field 2"
                const field2Source = "source2"
                const field2Geometry = {
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
                const field2Start = new Date("2023-02-01")
                const field2AcquiringMethod = "lease"
                await addField(
                    fdm,
                    principal_id,
                    b_id_farm,
                    field2Name,
                    field2Source,
                    field2Geometry,
                    field2Start,
                    field2AcquiringMethod,
                )

                const fields = await getFields(fdm, principal_id, b_id_farm)
                expect(fields.length).toBe(2)
                expect(fields.map((f) => f.b_name)).toEqual(
                    expect.arrayContaining([field1Name, field2Name]),
                )
            })

            it("should throw an error when permission check fails", async () => {
                const invalidPrincipalId = "invalid_principal"
                await expect(
                    getFields(fdm, invalidPrincipalId, b_id_farm),
                ).rejects.toThrowError(
                    "Principal does not have permission to perform this action",
                )
            })

            it("should get fields within a timeframe", async () => {
                // Add two fields to the farm with different start dates
                const field1Name = "Field 1"
                const field1Source = "source1"
                const field1Geometry = {
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
                const field1Start = new Date("2023-01-01")
                const field1AcquiringMethod = "owner"
                await addField(
                    fdm,
                    principal_id,
                    b_id_farm,
                    field1Name,
                    field1Source,
                    field1Geometry,
                    field1Start,
                    field1AcquiringMethod,
                )

                const field2Name = "Field 2"
                const field2Source = "source2"
                const field2Geometry = {
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
                const field2Start = new Date("2023-04-01")
                const field2AcquiringMethod = "lease"
                await addField(
                    fdm,
                    principal_id,
                    b_id_farm,
                    field2Name,
                    field2Source,
                    field2Geometry,
                    field2Start,
                    field2AcquiringMethod,
                )
                const field3Name = "Field 3"
                const field3Source = "source3"
                const field3Geometry = {
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
                const field3Start = new Date("2023-06-01")
                const field3End = new Date("2023-08-01")
                const field3AcquiringMethod = "lease"
                await addField(
                    fdm,
                    principal_id,
                    b_id_farm,
                    field3Name,
                    field3Source,
                    field3Geometry,
                    field3Start,
                    field3AcquiringMethod,
                    field3End,
                )
                const field4Name = "Field 4"
                const field4Source = "source4"
                const field4Geometry = {
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
                const field4Start = new Date("2023-07-01")
                const field4End = new Date("2023-09-01")
                const field4AcquiringMethod = "lease"
                await addField(
                    fdm,
                    principal_id,
                    b_id_farm,
                    field4Name,
                    field4Source,
                    field4Geometry,
                    field4Start,
                    field4AcquiringMethod,
                    field4End,
                )

                // Test with a timeframe that includes only Field 2
                const timeframe1 = {
                    start: new Date("2023-03-01"),
                    end: new Date("2023-05-01"),
                }
                const fields1 = await getFields(
                    fdm,
                    principal_id,
                    b_id_farm,
                    timeframe1,
                )
                expect(fields1.length).toBe(1)
                expect(fields1[0].b_name).toBe(field2Name)

                // Test with a timeframe that includes both Field 1 and Field 2
                const timeframe2 = {
                    start: new Date("2022-12-01"),
                    end: new Date("2023-05-01"),
                }
                const fields2 = await getFields(
                    fdm,
                    principal_id,
                    b_id_farm,
                    timeframe2,
                )
                expect(fields2.length).toBe(2)
                expect(fields2.map((f) => f.b_name)).toEqual(
                    expect.arrayContaining([field1Name, field2Name]),
                )

                // Test with a timeframe that includes field 3 and field 4
                const timeframe3 = {
                    start: new Date("2023-05-01"),
                    end: new Date("2023-09-01"),
                }

                const fields3 = await getFields(
                    fdm,
                    principal_id,
                    b_id_farm,
                    timeframe3,
                )

                expect(fields3.length).toBe(2)
                expect(fields3.map((f) => f.b_name)).toEqual(
                    expect.arrayContaining([field3Name, field4Name]),
                )
                //Test with only start date
                const fields4 = await getFields(fdm, principal_id, b_id_farm, {
                    start: new Date("2023-03-01"),
                    end: undefined,
                })
                expect(fields4.length).toBe(3)
                expect(fields4.map((f) => f.b_name)).toEqual(
                    expect.arrayContaining([
                        field2Name,
                        field3Name,
                        field4Name,
                    ]),
                )
                //Test with only end date
                const fields5 = await getFields(fdm, principal_id, b_id_farm, {
                    start: undefined,
                    end: new Date("2023-05-01"),
                })
                expect(fields5.length).toBe(2)
                expect(fields5.map((f) => f.b_name)).toEqual(
                    expect.arrayContaining([field1Name, field2Name]),
                )
            })
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
            expect(updatedField.b_start).toEqual(updatedAcquireDate)
            expect(updatedField.b_end).toEqual(updatedDiscardingDate)
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
            expect(updatedField.b_start).toEqual(AcquireDate) // Should remain the same
            expect(updatedField.b_end).toEqual(discardingDate) // Should remain the same
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
            expect(updatedField2.b_start).toEqual(AcquireDate) // Should remain the same
            expect(updatedField2.b_end).toEqual(discardingDate) // Should remain the same
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
            expect(updatedField3.b_start).toEqual(AcquireDate) // Should remain the same
            expect(updatedField3.b_end).toEqual(discardingDate) // Should remain the same
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
            expect(updatedField4.b_start).toEqual(updatedAcquireDate) // Should be updated
            expect(updatedField4.b_end).toEqual(discardingDate) // Should remain the same
            expect(updatedField4.b_acquiring_method).toBe(
                updatedAcquiringMethod,
            ) // Should remain the same
        })
    })
})
