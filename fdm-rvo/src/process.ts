import {
    addField,
    updateField,
    removeField,
    type FdmType,
} from "@svenvw/fdm-core"
import type { RvoImportReviewItem, UserChoiceMap } from "./types"
import { getItemId } from "./utils"

/**
 * Processes the RVO import review results by applying user-selected actions.
 *
 * Iterates through the provided review items and executes the corresponding action
 * (add, update, remove) based on the `userChoices` map.
 *
 * @param fdm - The FDM client instance for database operations.
 * @param principal_id - The ID of the principal (user) performing the import.
 * @param b_id_farm - The ID of the farm the fields belong to.
 * @param rvoImportReviewData - The list of review items resulting from the comparison.
 * @param userChoices - A map where keys are item IDs and values are the chosen `ImportReviewAction`.
 * @returns A promise that resolves when all actions have been processed.
 */
export async function processRvoImport(
    fdm: FdmType,
    principal_id: string,
    b_id_farm: string,
    rvoImportReviewData: RvoImportReviewItem<any>[],
    userChoices: UserChoiceMap,
) {
    for (const item of rvoImportReviewData) {
        const id = getItemId(item)
        const action = userChoices[id]

        if (!action || action === "IGNORE" || action === "NO_ACTION") {
            continue
        }

        switch (action) {
            case "ADD_REMOTE":
                if (item.rvoField) {
                    await addField(
                        fdm,
                        principal_id,
                        b_id_farm,
                        item.rvoField.properties.CropFieldDesignator ||
                            `RVO Perceel ${item.rvoField.properties.CropFieldID}`,
                        item.rvoField.properties.CropFieldID,
                        item.rvoField.geometry,
                        new Date(item.rvoField.properties.BeginDate),
                        "rvo_import",
                        item.rvoField.properties.EndDate
                            ? new Date(item.rvoField.properties.EndDate)
                            : undefined,
                    )
                }
                break
            case "UPDATE_FROM_REMOTE":
                if (item.localField && item.rvoField) {
                    await updateField(
                        fdm,
                        principal_id,
                        item.localField.b_id,
                        item.rvoField.properties.CropFieldDesignator ||
                            item.localField.b_name,
                        item.rvoField.properties.CropFieldID,
                        item.rvoField.geometry,
                        new Date(item.rvoField.properties.BeginDate),
                        "rvo_import",
                        item.rvoField.properties.EndDate
                            ? new Date(item.rvoField.properties.EndDate)
                            : undefined,
                    )
                }
                break
            case "KEEP_LOCAL": // Keep Local for Conflict
            case "REMOVE_LOCAL":
                if (item.localField) {
                    await removeField(fdm, principal_id, item.localField.b_id)
                }
                break
        }
    }
}
