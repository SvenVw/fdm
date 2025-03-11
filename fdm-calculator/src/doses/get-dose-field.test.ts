import { createFdmServer } from "@svenvw/fdm-core"
import type { FdmServerType } from "@svenvw/fdm-core"
import {
    addFarm,
    addFertilizer,
    addFertilizerApplication,
    addFertilizerToCatalogue,
    addField,
} from "@svenvw/fdm-core"
import { afterEach, beforeEach, describe, expect, it } from "vitest"
import type { Dose } from "./d"
import { getDoseForField } from "./get-dose-field"
import postgres from "postgres"

describe("getDoseForField", () => {
    let fdm: FdmServerType
    let b_id_farm: string
    let b_id: string
    let p_id: string
    let p_id_catalogue: string
    let principal_id: string
    let client: ReturnType<typeof postgres>

    beforeEach(async () => {
        const host = process.env.POSTGRES_HOST
        const port = Number(process.env.POSTGRES_PORT)
        const user = process.env.POSTGRES_USER
        const password = process.env.POSTGRES_PASSWORD
        const database = process.env.POSTGRES_DB
        fdm = createFdmServer(host, port, user, password, database)
        principal_id = "test-user"
        client = postgres({
            host,
            port,
            user,
            password,
            database,
            max: 1,
        })
    })
        afterEach(async () => {
        await client.end()
    })
    it("should calculate the correct dose for a field with a single application", async () => {
        b_id_farm = await addFarm(
            fdm,
            principal_id,
            "test farm",
            "1234567890",
            "test address",
            "1234AB",
        )
        b_id = await addField(
            fdm,
            principal_id,
            b_id_farm,
            "test field",
            "1",
            {
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
            },
            new Date(),
            "lease",
        )
        p_id_catalogue = `p_test_fertilizer_${Math.round(Math.random() * 1000)}`
        await addFertilizerToCatalogue(fdm, {
            p_id_catalogue: p_id_catalogue,
            p_source: "",
            p_name_nl: "",
            p_name_en: "",
            p_description: "",
            p_dm: 0,
            p_density: 0,
            p_om: 0,
            p_a: 0,
            p_hc: 0,
            p_eom: 0,
            p_eoc: 0,
            p_c_rt: 0,
            p_c_of: 0,
            p_c_if: 0,
            p_c_fr: 0,
            p_cn_of: 0,
            p_n_rt: 20,
            p_n_if: 0,
            p_n_of: 0,
            p_n_wc: 0,
            p_p_rt: 10,
            p_k_rt: 5,
            p_mg_rt: 0,
            p_ca_rt: 0,
            p_ne: 0,
            p_s_rt: 0,
            p_s_wc: 0,
            p_cu_rt: 0,
            p_zn_rt: 0,
            p_na_rt: 0,
            p_si_rt: 0,
            p_b_rt: 0,
            p_mn_rt: 0,
            p_ni_rt: 0,
            p_fe_rt: 0,
            p_mo_rt: 0,
            p_co_rt: 0,
            p_as_rt: 0,
            p_cd_rt: 0,
            p_cr_rt: 0,
            p_cr_vi: 0,
            p_pb_rt: 0,
            p_hg_rt: 0,
            p_cl_rt: 0,
            p_type_manure: false,
            p_type_mineral: true,
            p_type_compost: false,
        })
        p_id = await addFertilizer(
            fdm,
            principal_id,
            p_id_catalogue,
            b_id_farm,
            1000,
            new Date(),
        )
        await addFertilizerApplication(
            fdm,
            principal_id,
            b_id,
            p_id,
            100,
            undefined,
            new Date(),
        )

        const expectedDose: Dose = {
            p_dose_n: 2,
            p_dose_nw: 0,
            p_dose_p2o5: 1,
            p_dose_k2o: 0.5,
        }
        expect(await getDoseForField({ fdm, principal_id, b_id })).toEqual(
            expectedDose,
        )
    })

    it("should return 0 dose when no applications are found", async () => {
        b_id_farm = await addFarm(
            fdm,
            principal_id,
            "test farm",
            "1234567890",
            "test address",
            "1234AB",
        )
        b_id = await addField(
            fdm,
            principal_id,
            b_id_farm,
            "test field",
            "1",
            {
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
            },
            new Date(),
            "lease",
        )

        const expectedDose: Dose = {
            p_dose_n: 0,
            p_dose_nw: 0,
            p_dose_p2o5: 0,
            p_dose_k2o: 0,
        }
        expect(await getDoseForField({ fdm, principal_id, b_id })).toEqual(
            expectedDose,
        )
    })
})
