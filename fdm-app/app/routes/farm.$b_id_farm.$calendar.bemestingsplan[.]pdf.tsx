import { renderToStream } from "@react-pdf/renderer";
import {
  getFarm,
  getFields,
  getCultivations,
  getCurrentSoilData,
  getFertilizerApplications,
  getFertilizers,
} from "@svenvw/fdm-core";
import {
  createFunctionsForNorms,
  createFunctionsForFertilizerApplicationFilling,
  calculateDose,
  getNutrientAdvice,
  getOrganicMatterBalanceField,
  collectInputForOrganicMatterBalance,
} from "@svenvw/fdm-calculator";
import { data, type LoaderFunctionArgs } from "react-router";
import { Readable } from "node:stream";
import { getSession } from "~/lib/auth.server";
import { getTimeframe, getCalendar } from "~/lib/calendar";
import { fdm } from "~/lib/fdm.server";
import { getNmiApiKey } from "~/integrations/nmi";
import { BemestingsplanPDF, BemestingsplanData } from "~/components/pdf/BemestingsplanPDF";
import { getDefaultCultivation } from "~/lib/cultivation-helpers";
import { handleLoaderError } from "~/lib/error";

const formatDate = (date: Date | null | undefined) => {
  if (!date) return "-";
  const months = ["jan", "feb", "mrt", "apr", "mei", "jun", "jul", "aug", "sep", "okt", "nov", "dec"];
  return `${date.getDate()} ${months[date.getMonth()]}`;
};

export async function loader({ request, params }: LoaderFunctionArgs) {
  try {
    const b_id_farm = params.b_id_farm;
    const calendar = getCalendar(params);
    const timeframe = getTimeframe(params);

    if (!b_id_farm) {
      throw data("Farm ID is required", { status: 400 });
    }

    const session = await getSession(request);
    const nmiApiKey = getNmiApiKey();

    // 1. Fetch Farm Info
    const farm = await getFarm(fdm, session.principal_id, b_id_farm);
    if (!farm) {
      throw data("Farm not found", { status: 404 });
    }

    // 2. Fetch Fields
    const fields = await getFields(fdm, session.principal_id, b_id_farm, timeframe);

    // 3. Prepare data for PDF
    const functionsForNorms = createFunctionsForNorms("NL", calendar);
    const functionsForFilling = createFunctionsForFertilizerApplicationFilling("NL", calendar);

    // Get input for OM balance
    const omInput = await collectInputForOrganicMatterBalance(fdm, session.principal_id, b_id_farm, timeframe);

    const pdfFieldsData = await Promise.all(
      fields.map(async (field) => {
        try {
          const [cultivations, currentSoilData, applications, fertilizers] = await Promise.all([
            getCultivations(fdm, session.principal_id, field.b_id, timeframe),
            getCurrentSoilData(fdm, session.principal_id, field.b_id),
            getFertilizerApplications(fdm, session.principal_id, field.b_id, timeframe),
            getFertilizers(fdm, session.principal_id, b_id_farm),
          ]);

          const mainCultivation = getDefaultCultivation(cultivations, calendar) || cultivations[0];
          const catchCrop = cultivations.find((c) => c.b_lu !== mainCultivation?.b_lu);

          // OM Balance for this field
          const fieldOmInput = omInput.fields.find(f => f.field.b_id === field.b_id);
          let omBalanceResult = undefined;
          if (fieldOmInput) {
            omBalanceResult = await getOrganicMatterBalanceField(fdm, {
                fieldInput: fieldOmInput,
                fertilizerDetails: omInput.fertilizerDetails,
                cultivationDetails: omInput.cultivationDetails,
                timeFrame: omInput.timeFrame
            });
          }

          // Extract soil parameters
          const soilParams: Record<string, any> = {};
          let samplingDate: Date | undefined;
          if (Array.isArray(currentSoilData)) {
            for (const item of currentSoilData) {
              soilParams[item.parameter] = item.value;
              if (item.b_sampling_date && (!samplingDate || item.b_sampling_date > samplingDate)) {
                samplingDate = item.b_sampling_date;
              }
            }
          }

          // Calculate Norms (returns total kg for the field)
          const normInput = await functionsForNorms.collectInputForNorms(fdm, session.principal_id, field.b_id);
          const [normManure, normPhosphate, normNitrogen] = await Promise.all([
            functionsForNorms.calculateNormForManure(fdm, normInput),
            functionsForNorms.calculateNormForPhosphate(fdm, normInput),
            functionsForNorms.calculateNormForNitrogen(fdm, normInput),
          ]);

          // Calculate Advice (NMI returns kg/ha)
          let adviceKgHa = { n: 0, p2o5: 0, k2o: 0, mg: 0, s: 0, om: 0 };
          if (mainCultivation) {
            try {
              const result = await getNutrientAdvice(fdm, {
                b_lu_catalogue: mainCultivation.b_lu_catalogue,
                b_centroid: field.b_centroid as [number, number],
                currentSoilData: currentSoilData,
                nmiApiKey: nmiApiKey,
              });

              const yearAdvice = (result as any).data?.year || (result as any).year || result;

              if (yearAdvice && typeof yearAdvice === "object") {
                adviceKgHa = {
                  n: yearAdvice.d_n_req || 0,
                  p2o5: yearAdvice.d_p_req || 0,
                  k2o: yearAdvice.d_k_req || 0,
                  mg: yearAdvice.d_mg_req || 0,
                  s: yearAdvice.d_s_req || 0,
                  om: 0,
                };
              }
            } catch (e) {
              console.error(`Failed to get nutrient advice for field ${field.b_id}:`, e);
            }
          }

          // Calculate Doses (Planned) (Returns kg/ha)
          const dosesResult = calculateDose({
            applications: applications,
            fertilizers: fertilizers,
          });

          const plannedKgHa = {
            n: dosesResult.dose.p_dose_n || 0,
            nw: dosesResult.dose.p_dose_nw || 0,
            p2o5: dosesResult.dose.p_dose_p || 0,
            k2o: dosesResult.dose.p_dose_k || 0,
            om: dosesResult.dose.p_dose_eoc || 0,
          };

          return {
            id: field.b_id,
            name: field.b_name,
            area: field.b_area,
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
              nitrogen: normNitrogen.normValue,
              manure: normManure.normValue,
              phosphate: normPhosphate.normValue,
            },
            advice: adviceKgHa,
            planned: plannedKgHa,
            omBalance: omBalanceResult ? {
                balance: omBalanceResult.balance,
                supply: omBalanceResult.supply.total,
                supplyManure: omBalanceResult.supply.fertilizers.manure.total,
                supplyCompost: omBalanceResult.supply.fertilizers.compost.total,
                supplyCultivations: omBalanceResult.supply.cultivations.total,
                supplyResidues: omBalanceResult.supply.residues.total,
                degradation: omBalanceResult.degradation.total,
            } : undefined,
            applications: applications.map((app, idx) => {
              const fert = fertilizers.find((f) => f.p_id === app.p_id);
              const appDose = dosesResult.applications[idx];

              return {
                date: formatDate(app.p_app_date),
                product: fert?.p_name_nl || app.p_id,
                quantity: app.p_app_amount || 0,
                n: appDose.p_dose_n || 0,
                nw: appDose.p_dose_nw || 0,
                p2o5: appDose.p_dose_p || 0,
                k2o: appDose.p_dose_k || 0,
                om: appDose.p_dose_eoc || 0,
              };
            }),
          };
        } catch (error) {
          console.error(`Error processing field ${field.b_id}:`, error);
          return {
            id: field.b_id,
            name: field.b_name,
            area: field.b_area,
            mainCrop: "Fout bij laden",
            soil: {},
            norms: { nitrogen: 0, manure: 0, phosphate: 0 },
            advice: { n: 0, p2o5: 0, k2o: 0, mg: 0, s: 0, om: 0 },
            planned: { n: 0, nw: 0, p2o5: 0, k2o: 0, om: 0 },
            applications: [],
          };
        }
      }),
    );

    // Aggregates for farm level (Total kg)
    const totalArea = fields.reduce((acc, f) => acc + f.b_area, 0);
    const totalNormsKg = pdfFieldsData.reduce(
      (acc, f) => ({
        nitrogen: acc.nitrogen + f.norms.nitrogen,
        manure: acc.manure + f.norms.manure,
        phosphate: acc.phosphate + f.norms.phosphate,
      }),
      { nitrogen: 0, manure: 0, phosphate: 0 },
    );

    const totalAdviceKg = pdfFieldsData.reduce(
      (acc, f) => ({
        n: acc.n + (f.advice.n * f.area),
        p2o5: acc.p2o5 + (f.advice.p2o5 * f.area),
        k2o: acc.k2o + (f.advice.k2o * f.area),
        om: acc.om + (f.advice.om * f.area),
      }),
      { n: 0, p2o5: 0, k2o: 0, om: 0 },
    );

    const totalPlannedKg = pdfFieldsData.reduce(
      (acc, f) => ({
        n: acc.n + (f.planned.n * f.area),
        nw: acc.nw + (f.planned.nw * f.area),
        p2o5: acc.p2o5 + (f.planned.p2o5 * f.area),
        k2o: acc.k2o + (f.planned.k2o * f.area),
        om: acc.om + (f.planned.om * f.area),
      }),
      { n: 0, nw: 0, p2o5: 0, k2o: 0, om: 0 },
    );

    const bemestingsplanData: BemestingsplanData = {
      farm: {
        name: farm.b_name_farm || "Onbekend",
        kvk: farm.b_businessid_farm || undefined,
      },
      year: calendar,
      totalArea,
      norms: totalNormsKg,
      totalAdvice: totalAdviceKg,
      plannedUsage: totalPlannedKg,
      fields: pdfFieldsData,
    };

    // Render PDF to stream
    const stream = await renderToStream(<BemestingsplanPDF data={bemestingsplanData} />);

    return new Response(Readable.toWeb(stream) as any, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="Bemestingsplan_${farm.b_name_farm || b_id_farm}_${calendar}.pdf"`,
      },
    });
  } catch (error) {
    throw handleLoaderError(error);
  }
}
