/**
 * @file This file contains the data from "Tabel Fosfaatgebruiksnormen 2025" as specified
 * by the RVO for the Dutch fertilizer regulations. It defines the phosphate (P2O5) usage
 * norms in kg/ha based on the soil's phosphate status class (`FosfaatKlasse`) and the
 * land use type (grassland or arable land).
 *
 * @see https://www.rvo.nl/onderwerpen/mest/gebruiken-en-uitrijden/fosfaat-landbouwgrond/differentiatie
 *
 * @packageDocumentation
 */

/**
 * Defines the phosphate usage norms (in kg P2O5/ha) for 2025.
 * The norms are structured by phosphate status class and then by land use.
 */
export const fosfaatNormsData = [
    {
        Arm: { grasland: 120, bouwland: 120 },
        Laag: { grasland: 105, bouwland: 80 },
        Neutraal: { grasland: 95, bouwland: 70 },
        Ruim: { grasland: 90, bouwland: 60 },
        Hoog: { grasland: 75, bouwland: 40 },
    },
]
