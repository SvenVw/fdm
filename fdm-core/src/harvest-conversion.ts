import type * as schema from "./db/schema"
import { Decimal } from "decimal.js"

export function convertHarvestParameters(
    b_lu_harvestcat: schema.cultivationsCatalogueTypeSelect["b_lu_harvestcat"],
    b_lu_yield?: schema.harvestableAnalysesTypeInsert["b_lu_yield"],
    b_lu_yield_bruto?: schema.harvestableAnalysesTypeInsert["b_lu_yield_bruto"],
    b_lu_yield_fresh?: schema.harvestableAnalysesTypeInsert["b_lu_yield_fresh"],
    b_lu_tarra?: schema.harvestableAnalysesTypeInsert["b_lu_tarra"],
    b_lu_moist?: schema.harvestableAnalysesTypeInsert["b_lu_moist"],
    b_lu_uww?: schema.harvestableAnalysesTypeInsert["b_lu_uww"],
    b_lu_dm?: schema.harvestableAnalysesTypeInsert["b_lu_dm"],
    b_lu_cp?: schema.harvestableAnalysesTypeInsert["b_lu_cp"],
    f_no3_td_asis?: schema.harvestableAnalysesTypeInsert["f_no3_td_asis"],
    b_lu_n_harvestable?: schema.harvestableAnalysesTypeInsert["b_lu_n_harvestable"],
): StandardHarvestParameters {
    switch (b_lu_harvestcat) {
        case "HC010":
            return convertHarvestParametersForClassHC010(
                b_lu_yield_fresh,
                b_lu_dm,
                b_lu_n_harvestable,
            )
        case "HC020":
            return convertHarvestParametersForClassHC020(b_lu_yield, b_lu_cp)
        case "HC031":
            return convertHarvestParametersForClassHC031(b_lu_yield, b_lu_cp)
        case "HC040":
            return convertHarvestParametersForClassHC040(
                b_lu_yield_bruto,
                b_lu_tarra,
                b_lu_dm,
                b_lu_n_harvestable,
            )
        case "HC041":
            return convertHarvestParametersForClassHC041(
                b_lu_yield_bruto,
                b_lu_tarra,
                b_lu_dm,
                b_lu_n_harvestable,
            )
        case "HC042":
            return convertHarvestParametersForClassHC042(
                b_lu_yield_bruto,
                b_lu_tarra,
                b_lu_uww,
                b_lu_n_harvestable,
            )
        case "HC050":
            return convertHarvestParametersForClassHC050(
                b_lu_yield_fresh,
                b_lu_moist,
                b_lu_cp,
            )
        case "HC061":
            return convertHarvestParametersForClassHC061(
                b_lu_yield_fresh,
                b_lu_dm,
                f_no3_td_asis,
            )
        default:
            return {
                b_lu_yield: 0,
                b_lu_n_harvestable: 0,
            }
    }
}

function convertHarvestParametersForClassHC010(
    b_lu_yield_fresh: schema.harvestableAnalysesTypeInsert["b_lu_yield_fresh"],
    b_lu_dm: schema.harvestableAnalysesTypeInsert["b_lu_dm"],
    b_lu_n_harvestable: schema.harvestableAnalysesTypeInsert["b_lu_n_harvestable"],
): StandardHarvestParameters {
    // Check if the required parameters are present
    if (!b_lu_yield_fresh || !b_lu_dm || !b_lu_n_harvestable) {
        throw new Error(
            "Missing required parameters for HC010: b_lu_yield_fresh, b_lu_dm, b_lu_n_harvestable",
        )
    }

    // Calculate b_lu_yield (dry matter yield)
    const b_lu_yield_calculated = new Decimal(b_lu_yield_fresh)
        .times(Decimal(b_lu_dm))
        .dividedBy(1000)
        .toNumber()

    // Return the calculated values
    return {
        b_lu_yield: b_lu_yield_calculated,
        b_lu_n_harvestable: b_lu_n_harvestable,
    }
}

function convertHarvestParametersForClassHC020(
    b_lu_yield: schema.harvestableAnalysesTypeInsert["b_lu_yield"],
    b_lu_cp: schema.harvestableAnalysesTypeInsert["b_lu_cp"],
): StandardHarvestParameters {
    // Check if the required parameters are present
    if (!b_lu_yield || !b_lu_cp) {
        throw new Error(
            "Missing required parameters for HC020: b_lu_yield, b_lu_cp",
        )
    }

    // Calculate b_lu_n_harvestable (Nitrogen content in harvestable yield)
    // Assuming CP (Crude Protein) is approximately N * 6.25
    const b_lu_n_harvestable_calculated = new Decimal(b_lu_cp)
        .dividedBy(6.25)
        .toNumber()

    // Return the calculated values
    return {
        b_lu_yield: b_lu_yield,
        b_lu_n_harvestable: b_lu_n_harvestable_calculated,
    }
}

function convertHarvestParametersForClassHC031(
    b_lu_yield: schema.harvestableAnalysesTypeInsert["b_lu_yield"],
    b_lu_cp: schema.harvestableAnalysesTypeInsert["b_lu_cp"],
): StandardHarvestParameters {
    // Check if the required parameters are present
    if (!b_lu_yield || !b_lu_cp) {
        throw new Error(
            "Missing required parameters for HC031: b_lu_yield, b_lu_cp",
        )
    }

    // Calculate b_lu_n_harvestable (Nitrogen content in harvestable yield)
    // Assuming CP (Crude Protein) is approximately N * 6.25
    const b_lu_n_harvestable_calculated = new Decimal(b_lu_cp)
        .dividedBy(6.25)
        .toNumber()

    // Return the calculated values
    return {
        b_lu_yield: b_lu_yield,
        b_lu_n_harvestable: b_lu_n_harvestable_calculated,
    }
}

function convertHarvestParametersForClassHC040(
    b_lu_yield_bruto: schema.harvestableAnalysesTypeInsert["b_lu_yield_bruto"],
    b_lu_tarra: schema.harvestableAnalysesTypeInsert["b_lu_tarra"],
    b_lu_dm: schema.harvestableAnalysesTypeInsert["b_lu_dm"],
    b_lu_n_harvestable: schema.harvestableAnalysesTypeInsert["b_lu_n_harvestable"],
): StandardHarvestParameters {
    // Check if the required parameters are present
    if (!b_lu_yield_bruto || !b_lu_tarra || !b_lu_dm || !b_lu_n_harvestable) {
        throw new Error(
            "Missing required parameters for HC040: b_lu_yield_bruto, b_lu_tarra, b_lu_dm, b_lu_n_harvestable",
        )
    }

    // Calculate b_lu_yield (dry matter yield)
    const b_lu_yield_fresh = new Decimal(100)
        .minus(b_lu_tarra)
        .dividedBy(100)
        .times(b_lu_yield_bruto)
    const b_lu_yield = b_lu_yield_fresh
        .times(b_lu_dm)
        .dividedBy(1000)
        .toNumber()

    // Return the calculated values
    return {
        b_lu_yield: b_lu_yield,
        b_lu_n_harvestable: b_lu_n_harvestable,
    }
}

function convertHarvestParametersForClassHC041(
    b_lu_yield_bruto: schema.harvestableAnalysesTypeInsert["b_lu_yield_bruto"],
    b_lu_tarra: schema.harvestableAnalysesTypeInsert["b_lu_tarra"],
    b_lu_dm: schema.harvestableAnalysesTypeInsert["b_lu_dm"],
    b_lu_n_harvestable: schema.harvestableAnalysesTypeInsert["b_lu_n_harvestable"],
): StandardHarvestParameters {
    // Check if the required parameters are present
    if (!b_lu_yield_bruto || !b_lu_tarra || !b_lu_dm || !b_lu_n_harvestable) {
        throw new Error(
            "Missing required parameters for HC041: b_lu_yield_bruto, b_lu_tarra, b_lu_dm, b_lu_n_harvestable",
        )
    }

    // Calculate b_lu_yield (dry matter yield)
    const b_lu_yield_fresh = new Decimal(100)
        .minus(b_lu_tarra)
        .dividedBy(100)
        .times(b_lu_yield_bruto)
    const b_lu_yield = b_lu_yield_fresh
        .times(b_lu_dm)
        .dividedBy(1000)
        .toNumber()

    // Return the calculated values
    return {
        b_lu_yield: b_lu_yield,
        b_lu_n_harvestable: b_lu_n_harvestable,
    }
}

function convertHarvestParametersForClassHC042(
    b_lu_yield_bruto: schema.harvestableAnalysesTypeInsert["b_lu_yield_bruto"],
    b_lu_tarra: schema.harvestableAnalysesTypeInsert["b_lu_tarra"],
    b_lu_uww: schema.harvestableAnalysesTypeInsert["b_lu_uww"],
    b_lu_n_harvestable: schema.harvestableAnalysesTypeInsert["b_lu_n_harvestable"],
): StandardHarvestParameters {
    // Check if the required parameters are present
    if (!b_lu_yield_bruto || !b_lu_tarra || !b_lu_uww || !b_lu_n_harvestable) {
        throw new Error(
            "Missing required parameters for HC042: b_lu_yield_bruto, b_lu_tarra, b_lu_uww, b_lu_n_harvestable",
        )
    }

    // Calculate dry matter content according to Ludwig,1972 (https://edepot.wur.nl/368270 page 11)
    const b_lu_dm = new Decimal(b_lu_uww).times(0.049).add(2.0).times(10)

    // Calculate b_lu_yield (dry matter yield)
    const b_lu_yield_fresh = new Decimal(100)
        .minus(b_lu_tarra)
        .dividedBy(100)
        .times(b_lu_yield_bruto)
    const b_lu_yield = b_lu_yield_fresh
        .times(b_lu_dm)
        .dividedBy(1000)
        .toNumber()

    // Return the calculated values
    return {
        b_lu_yield: b_lu_yield,
        b_lu_n_harvestable: b_lu_n_harvestable,
    }
}

function convertHarvestParametersForClassHC050(
    b_lu_yield_fresh: schema.harvestableAnalysesTypeInsert["b_lu_yield_fresh"],
    b_lu_moist: schema.harvestableAnalysesTypeInsert["b_lu_moist"],
    b_lu_cp: schema.harvestableAnalysesTypeInsert["b_lu_cp"],
): StandardHarvestParameters {
    // Check if the required parameters are present
    if (!b_lu_yield_fresh || !b_lu_moist || !b_lu_cp) {
        throw new Error(
            "Missing required parameters for HC050: b_lu_yield_fresh, b_lu_moist, b_lu_cp",
        )
    }

    // Calculate b_lu_dm (dry matter content)
    const b_lu_dm = new Decimal(100).minus(b_lu_moist).times(10)

    // Calculate b_lu_yield (dry matter yield)
    const b_lu_yield_calculated = new Decimal(b_lu_yield_fresh)
        .times(b_lu_dm)
        .dividedBy(1000)
        .toNumber()

    // Calculate b_lu_n_harvestable (Nitrogen content in harvestable yield)
    // Assuming CP (Crude Protein) is approximately N * 5.7
    const b_lu_n_harvestable_calculated = new Decimal(b_lu_cp)
        .dividedBy(5.7)
        .toNumber()

    // Return the calculated values
    return {
        b_lu_yield: b_lu_yield_calculated,
        b_lu_n_harvestable: b_lu_n_harvestable_calculated,
    }
}

function convertHarvestParametersForClassHC061(
    b_lu_yield_fresh: schema.harvestableAnalysesTypeInsert["b_lu_yield_fresh"],
    b_lu_dm: schema.harvestableAnalysesTypeInsert["b_lu_dm"],
    f_no3_td_asis: schema.harvestableAnalysesTypeInsert["f_no3_td_asis"],
): StandardHarvestParameters {
    // Check if the required parameters are present
    if (!b_lu_yield_fresh || !b_lu_dm || !f_no3_td_asis) {
        throw new Error(
            "Missing required parameters for HC061: b_lu_yield_fresh, b_lu_dm, f_no3_td_asis",
        )
    }

    // Calculate b_lu_yield (dry matter yield)
    const b_lu_yield = new Decimal(b_lu_yield_fresh)
        .times(b_lu_dm)
        .dividedBy(1000)
        .toNumber()

    // Calculate b_lu_n_harvestable (Nitrogen content in harvestable yield)
    // Assuming f_no3_td_asis is the nitrate content in fresh matter (g NO3 /kg), convert to g N/kg DM
    const b_lu_n_harvestable = new Decimal(f_no3_td_asis)
        .times(0.226) // NO3 to N
        .dividedBy(new Decimal(b_lu_dm).dividedBy(1000)) // per kg fresh to per kg dry
        .toNumber()

    // Return the calculated values
    return {
        b_lu_yield: b_lu_yield,
        b_lu_n_harvestable: b_lu_n_harvestable,
    }
}

type StandardHarvestParameters = {
    b_lu_yield: number
    b_lu_n_harvestable: number
}
