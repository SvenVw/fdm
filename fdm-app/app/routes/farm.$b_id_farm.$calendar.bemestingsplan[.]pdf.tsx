import { renderToStream } from "@react-pdf/renderer";
import {
  getFarm,
  getFields,
  getCultivations,
  getCurrentSoilData,
} from "@svenvw/fdm-core";
import {
  collectInputForOrganicMatterBalance,
  aggregateNormsToFarmLevel,
  aggregateNormFillingsToFarmLevel,
  getOrganicMatterBalanceField,
} from "@svenvw/fdm-calculator";
import { data, type LoaderFunctionArgs } from "react-router";
import { Readable } from "node:stream";
import path from "node:path";
import { format } from "date-fns";
import { nl } from "date-fns/locale";
import { getSession } from "~/lib/auth.server";
import { getTimeframe, getCalendar } from "~/lib/calendar";
import { fdm } from "~/lib/fdm.server";
import { BemestingsplanPDF, BemestingsplanData } from "~/components/pdf/BemestingsplanPDF";
import { getDefaultCultivation } from "~/lib/cultivation-helpers";
import { handleLoaderError } from "~/lib/error";
import { clientConfig } from "~/lib/config";
import {
    getNorms,
    getNutrientAdviceForField,
    getPlannedDosesForField,
} from "~/integrations/calculator";

const formatDate = (date: Date | null | undefined) => {
  if (!date) return "-";
  return format(date, "d MMM", { locale: nl });
};

export async function loader({ request, params }: LoaderFunctionArgs) {
    try {
        const b_id_farm = params.b_id_farm
        const calendar = getCalendar(params)
        const timeframe = getTimeframe(params)

        if (!b_id_farm) {
            throw data("Farm ID is required", { status: 400 })
        }

        const session = await getSession(request)

        // 1. Fetch Farm Info
        const farm = await getFarm(fdm, session.principal_id, b_id_farm)
        if (!farm) {
            throw data("Farm not found", { status: 404 })
        }

        // 2. Fetch Fields
        const fields = await getFields(
            fdm,
            session.principal_id,
            b_id_farm,
            timeframe,
        )

        // Get input for OM balance
        const omInput = await collectInputForOrganicMatterBalance(
            fdm,
            session.principal_id,
            b_id_farm,
            timeframe,
        )

        const pdfFieldsData = await Promise.all(
            fields.map(async (field) => {
                try {
                    // Fetch display data (and data needed for OM balance if not using integration for it completely)
                    const [cultivations, currentSoilData] = await Promise.all([
                        getCultivations(
                            fdm,
                            session.principal_id,
                            field.b_id,
                            timeframe,
                        ),
                        getCurrentSoilData(
                            fdm,
                            session.principal_id,
                            field.b_id,
                        ),
                    ])

                    const mainCultivation =
                        getDefaultCultivation(cultivations, calendar) ||
                        cultivations[0]
                    const catchCrop = cultivations.find(
                        (c) => c.b_lu !== mainCultivation?.b_lu,
                    )

                    // OM Balance for this field
                    const fieldOmInput = omInput.fields.find(
                        (f) => f.field.b_id === field.b_id,
                    )
                    let omBalanceResult = undefined
                    if (fieldOmInput) {
                        omBalanceResult = await getOrganicMatterBalanceField(
                            fdm,
                            {
                                fieldInput: fieldOmInput,
                                fertilizerDetails: omInput.fertilizerDetails,
                                cultivationDetails: omInput.cultivationDetails,
                                timeFrame: omInput.timeFrame,
                            },
                        )
                    }

                    // Extract soil parameters for display
                    const soilParams: Record<string, any> = {}
                    let samplingDate: Date | undefined
                    if (Array.isArray(currentSoilData)) {
                        for (const item of currentSoilData) {
                            soilParams[item.parameter] = item.value
                            if (
                                item.b_sampling_date &&
                                (!samplingDate ||
                                    item.b_sampling_date > samplingDate)
                            ) {
                                samplingDate = item.b_sampling_date
                            }
                        }
                    }

                    // 3. Use Integration Functions for Calculations

                    // Calculate Norms & Filling
                    const normsResult = await getNorms({
                        fdm,
                        principal_id: session.principal_id,
                        b_id: field.b_id,
                        calendar: calendar as "2025" | "2026",
                    })

                    // Calculate Nutrient Advice
                    let adviceKgHa = {
                        n: 0,
                        nw: 0,
                        p2o5: 0,
                        k2o: 0,
                        mg: 0,
                        s: 0,
                        om: 0,
                        ca: 0,
                        na: 0,
                        cu: 0,
                        zn: 0,
                        co: 0,
                        mn: 0,
                        mo: 0,
                        b: 0,
                    }
                    try {
                        if (mainCultivation) {
                            const result = await getNutrientAdviceForField({
                                fdm,
                                principal_id: session.principal_id,
                                b_id: field.b_id,
                                b_centroid: field.b_centroid as [
                                    number,
                                    number,
                                ],
                                timeframe,
                            })

                            const yearAdvice =
                                (result as any).data?.year ||
                                (result as any).year ||
                                result
                            if (yearAdvice && typeof yearAdvice === "object") {
                                adviceKgHa = {
                                    n: yearAdvice.d_n_req || 0,
                                    nw: yearAdvice.d_n_req || 0,
                                    p2o5: yearAdvice.d_p_req || 0,
                                    k2o: yearAdvice.d_k_req || 0,
                                    mg: yearAdvice.d_mg_req || 0,
                                    s: yearAdvice.d_s_req || 0,
                                    om: 0,
                                    ca: yearAdvice.d_ca_req || 0,
                                    na: yearAdvice.d_na_req || 0,
                                    cu: yearAdvice.d_cu_req || 0,
                                    zn: yearAdvice.d_zn_req || 0,
                                    co: yearAdvice.d_co_req || 0,
                                    mn: yearAdvice.d_mn_req || 0,
                                    mo: yearAdvice.d_mo_req || 0,
                                    b: yearAdvice.d_b_req || 0,
                                }
                            }
                        }
                    } catch (e) {
                        console.error(
                            `Failed to get nutrient advice for field ${field.b_id}:`,
                            e,
                        )
                    }

                    // Calculate Doses (Planned)
                    const {
                        doses: dosesResult,
                        applications,
                        fertilizers,
                    } = await getPlannedDosesForField({
                        fdm,
                        principal_id: session.principal_id,
                        b_id: field.b_id,
                        b_id_farm,
                        timeframe,
                    })

                    const plannedKgHa = {
                        n: dosesResult.dose.p_dose_n || 0,
                        nw: dosesResult.dose.p_dose_nw || 0,
                        p2o5: dosesResult.dose.p_dose_p || 0,
                        k2o: dosesResult.dose.p_dose_k || 0,
                        om: dosesResult.dose.p_dose_eoc || 0,
                        mg: dosesResult.dose.p_dose_mg || 0,
                        s: dosesResult.dose.p_dose_s || 0,
                        ca: dosesResult.dose.p_dose_ca || 0,
                        na: dosesResult.dose.p_dose_na || 0,
                        cu: dosesResult.dose.p_dose_cu || 0,
                        zn: dosesResult.dose.p_dose_zn || 0,
                        co: dosesResult.dose.p_dose_co || 0,
                        mn: dosesResult.dose.p_dose_mn || 0,
                        mo: dosesResult.dose.p_dose_mo || 0,
                        b: dosesResult.dose.p_dose_b || 0,
                    }

                    return {
                        id: field.b_id,
                        name: field.b_name,
                        area: field.b_area || 0,
                        isBufferstrip: field.b_bufferstrip,
                        mainCrop: mainCultivation?.b_lu_name || "Geen gewas",
                        catchCrop: catchCrop?.b_lu_name,
                        soil: {
                            date: formatDate(samplingDate),
                            ph: soilParams.a_ph_cc,
                            pAl: soilParams.a_p_al,
                            pCaCl: soilParams.a_p_cc,
                            kCc: soilParams.a_k_cc,
                            om: soilParams.a_som_loi,
                            soilTypeAgr: soilParams.b_soiltype_agr,
                            clay: soilParams.a_clay_mi,
                            sand: soilParams.a_sand_mi,
                            silt: soilParams.a_silt_mi,
                        },
                        norms: {
                            nitrogen: normsResult.value.nitrogen,
                            manure: normsResult.value.manure,
                            phosphate: normsResult.value.phosphate,
                        },
                        normsFilling: {
                            nitrogen: normsResult.filling.nitrogen,
                            manure: normsResult.filling.manure,
                            phosphate: normsResult.filling.phosphate,
                        },
                        advice: adviceKgHa,
                        planned: plannedKgHa,
                        omBalance: omBalanceResult
                            ? {
                                  balance: omBalanceResult.balance,
                                  supply: omBalanceResult.supply.total,
                                  supplyManure:
                                      omBalanceResult.supply.fertilizers.manure
                                          .total,
                                  supplyCompost:
                                      omBalanceResult.supply.fertilizers.compost
                                          .total,
                                  supplyCultivations:
                                      omBalanceResult.supply.cultivations.total,
                                  supplyResidues:
                                      omBalanceResult.supply.residues.total,
                                  degradation:
                                      omBalanceResult.degradation.total,
                              }
                            : undefined,
                        applications: applications.map((app, idx) => {
                            const fert = fertilizers.find(
                                (f) => f.p_id === app.p_id,
                            )
                            const appDose = dosesResult.applications[idx]

                            return {
                                date: formatDate(app.p_app_date),
                                product: fert?.p_name_nl || app.p_id,
                                quantity: app.p_app_amount || 0,
                                n: appDose.p_dose_n || 0,
                                nw: appDose.p_dose_nw || 0,
                                p2o5: appDose.p_dose_p || 0,
                                k2o: appDose.p_dose_k || 0,
                                om: appDose.p_dose_eoc || 0,
                            }
                        }),
                    }
                } catch (error) {
                    console.error(
                        `Error processing field ${field.b_id}:`,
                        error,
                    )
                    return {
                        id: field.b_id,
                        name: field.b_name,
                        area: field.b_area || 0,
                        isBufferstrip: field.b_bufferstrip,
                        mainCrop: "Fout bij laden",
                        soil: {},
                        norms: { nitrogen: 0, manure: 0, phosphate: 0 },
                        normsFilling: { nitrogen: 0, manure: 0, phosphate: 0 },
                        advice: {
                            n: 0,
                            nw: 0,
                            p2o5: 0,
                            k2o: 0,
                            mg: 0,
                            s: 0,
                            om: 0,
                            ca: 0,
                            na: 0,
                            cu: 0,
                            zn: 0,
                            co: 0,
                            mn: 0,
                            mo: 0,
                            b: 0,
                        },
                        planned: {
                            n: 0,
                            nw: 0,
                            p2o5: 0,
                            k2o: 0,
                            om: 0,
                            mg: 0,
                            s: 0,
                            ca: 0,
                            na: 0,
                            cu: 0,
                            zn: 0,
                            co: 0,
                            mn: 0,
                            mo: 0,
                            b: 0,
                        },
                        applications: [],
                    }
                }
            }),
        )

        // Aggregates for farm level (Total kg)
        const totalArea = fields.reduce((acc, f) => acc + (f.b_area || 0), 0)
        const productiveArea = fields.reduce(
            (acc, f) => acc + (f.b_bufferstrip ? 0 : f.b_area || 0),
            0,
        )

        // Correctly aggregate norms and fillings using calculator functions
        const totalNormsKg = aggregateNormsToFarmLevel(
            pdfFieldsData.map((f) => ({
                b_id: f.id,
                b_area: f.area,
                norms: {
                    manure: { normValue: f.norms.manure, normSource: "" },
                    nitrogen: { normValue: f.norms.nitrogen, normSource: "" },
                    phosphate: { normValue: f.norms.phosphate, normSource: "" },
                },
            })),
        )

        const totalNormsFillingKg = aggregateNormFillingsToFarmLevel(
            pdfFieldsData.map((f) => ({
                b_id: f.id,
                b_area: f.area,
                normsFilling: {
                    manure: {
                        normFilling: f.normsFilling?.manure || 0,
                        applicationFilling: [],
                    },
                    nitrogen: {
                        normFilling: f.normsFilling?.nitrogen || 0,
                        applicationFilling: [],
                    },
                    phosphate: {
                        normFilling: f.normsFilling?.phosphate || 0,
                        applicationFilling: [],
                    },
                },
            })),
        )

        const totalAdviceKg = pdfFieldsData.reduce(
            (acc, f) => ({
                n: acc.n + f.advice.n * f.area,
                nw: acc.nw + f.advice.nw * f.area,
                p2o5: acc.p2o5 + f.advice.p2o5 * f.area,
                k2o: acc.k2o + f.advice.k2o * f.area,
                om: acc.om + f.advice.om * f.area,
            }),
            { n: 0, nw: 0, p2o5: 0, k2o: 0, om: 0 },
        )

        const totalPlannedUsageKg = pdfFieldsData.reduce(
            (acc, f) => ({
                n: acc.n + f.planned.n * f.area,
                nw: acc.nw + f.planned.nw * f.area,
                p2o5: acc.p2o5 + f.planned.p2o5 * f.area,
                k2o: acc.k2o + f.planned.k2o * f.area,
                om: acc.om + f.planned.om * f.area,
            }),
            { n: 0, nw: 0, p2o5: 0, k2o: 0, om: 0 },
        )

        // Calculate aggregate OM balance (weighted average per ha)
        const totalOmBalance =
            totalArea > 0
                ? pdfFieldsData.reduce(
                      (acc, f) => {
                          if (f.omBalance) {
                              return {
                                  balance:
                                      acc.balance +
                                      f.omBalance.balance * f.area,
                                  supply:
                                      acc.supply + f.omBalance.supply * f.area,
                                  degradation:
                                      acc.degradation +
                                      f.omBalance.degradation * f.area,
                              }
                          }
                          return acc
                      },
                      { balance: 0, supply: 0, degradation: 0 },
                  )
                : { balance: 0, supply: 0, degradation: 0 }

        const farmOmBalance = {
            balance: totalArea > 0 ? totalOmBalance.balance / totalArea : 0,
            supply: totalArea > 0 ? totalOmBalance.supply / totalArea : 0,
            degradation:
                totalArea > 0 ? totalOmBalance.degradation / totalArea : 0,
        }

        // Get absolute path for logo
        const publicDir = path.resolve(process.cwd(), "fdm-app", "public")

        const relativeLogoPath = clientConfig.logo?.startsWith("/")
            ? clientConfig.logo.substring(1)
            : clientConfig.logo
        const logoPath = relativeLogoPath
            ? path.join(publicDir, relativeLogoPath)
            : undefined

        const logoInverted = path.join(
            publicDir,
            "fdm-high-resolution-logo-grayscale-transparent.png",
        )

        const bemestingsplanData: BemestingsplanData = {
            config: {
                name: clientConfig.name,
                logo: logoPath,
                logoInverted: logoInverted,
            },
            farm: {
                name: farm.b_name_farm || "Onbekend",
                kvk: farm.b_businessid_farm || undefined,
            },
            year: calendar,
            totalArea,
            productiveArea,
            norms: totalNormsKg,
            normsFilling: totalNormsFillingKg,
            totalAdvice: totalAdviceKg,
            plannedUsage: totalPlannedUsageKg,
            omBalance: farmOmBalance,
            fields: pdfFieldsData,
        }

        const stream = await renderToStream(
            <BemestingsplanPDF data={bemestingsplanData} />,
        )

        return new Response(
            Readable.toWeb(stream) as unknown as ReadableStream,
            {
                headers: {
                    "Content-Type": "application/pdf",
                    "Content-Disposition": `attachment; filename="Bemestingsplan_${farm.b_name_farm || b_id_farm}_${calendar}.pdf"`,
                },
            },
        )
    } catch (error) {
        throw handleLoaderError(error)
    }
}
