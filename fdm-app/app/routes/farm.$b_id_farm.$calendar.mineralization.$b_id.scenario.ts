import { getMineralizationScenarioSchema } from "@nmi-agro/fdm-calculator"
import { data, type LoaderFunctionArgs } from "react-router"
import type { FieldMineralizationOutcome } from "~/lib/mineralization"
import { calculateScenario, getMineralizationYear } from "~/integrations/mineralization.server"
import { getSession } from "~/lib/auth.server"
import { handleLoaderError } from "~/lib/error"

/**
 * Calculates a what-if scenario for a field without saving it.
 *
 * The scenario is passed as JSON in the `scenario` search parameter. Problems with the scenario
 * or the calculation are returned as an outcome with `status: "error"`, so the page keeps working.
 */
export async function loader({ request, params }: LoaderFunctionArgs) {
  try {
    const b_id_farm = params.b_id_farm
    const b_id = params.b_id
    if (!b_id_farm || !b_id) {
      throw data("invalid: b_id_farm or b_id", { status: 400 })
    }
    const session = await getSession(request)
    const year = getMineralizationYear(params.calendar)

    const invalid: FieldMineralizationOutcome = {
      b_id,
      b_name: null,
      b_area: null,
      status: "error",
      message: "Het scenario is niet compleet: controleer de datums en hoeveelheden.",
    }
    let raw: unknown
    try {
      raw = JSON.parse(new URL(request.url).searchParams.get("scenario") ?? "")
    } catch {
      return invalid
    }
    const parsed = getMineralizationScenarioSchema(year).safeParse(raw)
    if (!parsed.success) return invalid

    return await calculateScenario({
      principal_id: session.principal_id,
      b_id_farm,
      b_id,
      year,
      scenario: parsed.data,
    })
  } catch (error) {
    const normalized = handleLoaderError(error)
    throw normalized ?? error
  }
}
