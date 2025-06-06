import nitrogenStandardsData from './stikstofgebruiksnorm-data.json';

// Define types for the imported data for better type safety
interface NitrogenStandard {
  cultivation_rvo_table2: string;
  b_lu_catalogue_match: string[];
  type: string;
  variety_type?: string;
  varieties?: string[];
  norms?: {
    klei: { standard: number; nv_area: number };
    zand_nwc: { standard: number; nv_area: number };
    zand_zuid: { standard: number; nv_area: number };
    loss: { standard: number; nv_area: number };
    veen: { standard: number; nv_area: number };
  };
  varieties_hoge_norm?: string[];
  varieties_lage_norm?: string[];
  norms_hoge_norm?: {
    klei: { standard: number; nv_area: number };
    zand_nwc: { standard: number; nv_area: number };
    zand_zuid: { standard: number; nv_area: number };
    loss: { standard: number; nv_area: number };
    veen: { standard: number; nv_area: number };
  };
  norms_lage_norm?: {
    klei: { standard: number; nv_area: number };
    zand_nwc: { standard: number; nv_area: number };
    zand_zuid: { standard: number; nv_area: number };
    loss: { standard: number; nv_area: number };
    veen: { standard: number; nv_area: number };
  };
  norms_overig?: {
    klei: { standard: number; nv_area: number };
    zand_nwc: { standard: number; nv_area: number };
    zand_zuid: { standard: number; nv_area: number };
    loss: { standard: number; nv_area: number };
    veen: { standard: number; nv_area: number };
  };
  derogatie_norms?: {
    klei: { standard: number; nv_area: number };
    zand_nwc: { standard: number; nv_area: number };
    zand_zuid: { standard: number; nv_area: number };
    loss: { standard: number; nv_area: number };
    veen: { standard: number; nv_area: number };
  };
  non_derogatie_norms?: {
    klei: { standard: number; nv_area: number };
    zand_nwc: { standard: number; nv_area: number };
    zand_zuid: { standard: number; nv_area: number };
    loss: { standard: number; nv_area: number };
    veen: { standard: number; nv_area: number };
  };
  sub_types?: Array<{
    omschrijving?: string;
    period_description?: string;
    period_start_month?: number;
    period_start_day?: number;
    period_end_month?: number;
    period_end_day?: number;
    norms: {
      klei: { standard: number; nv_area: number };
      zand_nwc: { standard: number; nv_area: number };
      zand_zuid: { standard: number; nv_area: number };
      loss: { standard: number; nv_area: number };
      veen: { standard: number; nv_area: number };
    };
    winterteelt_voor_31_12?: {
        klei: { standard: number; nv_area: number };
        zand_nwc: { standard: number; nv_area: number };
        zand_zuid: { standard: number; nv_area: number };
        loss: { standard: number; nv_area: number };
        veen: { standard: number; nv_area: number };
    };
    winterteelt_na_31_12?: {
        klei: { standard: number; nv_area: number };
        zand_nwc: { standard: number; nv_area: number };
        zand_zuid: { standard: number; nv_area: number };
        loss: { standard: number; nv_area: number };
        veen: { standard: number; nv_area: number };
    };
  }>;
}

type RegionKey = 'klei' | 'zand_nwc' | 'zand_zuid' | 'loss' | 'veen';

type NormsByRegion = {
  [key in RegionKey]: { standard: number; nv_area: number };
};

export interface GebruiksnormResult {
  normValue: number;
  cultivationNameTabel2: string;
}

/**
 * Placeholder for the function that determines the region based on latitude and longitude.
 * This function needs to be provided by the user.
 * For now, it returns a hardcoded 'klei' for demonstration purposes.
 * @param latitude - The latitude of the location.
 * @param longitude - The longitude of the location.
 * @returns The region key (e.g., 'klei', 'zand_nwc', 'loss').
 */
function getRegion(latitude: number, longitude: number): RegionKey {
  // TODO: Implement actual region determination logic based on lat/lon
  // This is a placeholder. User will provide the actual implementation.
  if (latitude > 52 && longitude > 5) return 'zand_nwc'; // Example: Northern/Western/Central Sand
  if (latitude < 52 && longitude > 5) return 'zand_zuid'; // Example: Southern Sand
  if (latitude > 51 && longitude < 5) return 'klei'; // Example: Clay
  if (latitude < 51 && longitude < 5) return 'veen'; // Example: Peat
  return 'loss'; // Default or fallback
}

/**
 * Helper function to get the correct norms object based on cultivation type and specific parameters.
 * @param selectedStandard - The matched NitrogenStandard object.
 * @param b_lu_variety - Optional. The specific variety of the cultivation.
 * @param is_derogatie_bedrijf - Optional. Boolean indicating if the farm has derogation.
 * @param b_lu_end - The termination date of the cultivation.
 * @returns The applicable norms object for the region, or undefined if not found.
 */
function getNormsForCultivation(
  selectedStandard: NitrogenStandard,
  b_lu_variety: string | undefined,
  is_derogatie_bedrijf: boolean | undefined,
  b_lu_end: Date
): NormsByRegion | undefined {
  if (selectedStandard.sub_types) {
    const endDate = new Date(b_lu_end);
    const matchingSubType = selectedStandard.sub_types.find(sub => {
      if (sub.period_start_month && sub.period_end_month) {
        const startPeriod = new Date(endDate.getFullYear(), sub.period_start_month - 1, sub.period_start_day || 1);
        const endPeriod = new Date(endDate.getFullYear(), sub.period_end_month - 1, sub.period_end_day || 1);
        if (sub.period_start_month > sub.period_end_month) {
          endPeriod.setFullYear(endDate.getFullYear() + 1);
        }
        return endDate >= startPeriod && endDate <= endPeriod;
      }
      return false;
    });
    return matchingSubType?.norms;
  } else if (selectedStandard.type === 'aardappel' && b_lu_variety) {
    const varietyLower = b_lu_variety.toLowerCase();
    if (selectedStandard.varieties_hoge_norm?.some(v => v.toLowerCase() === varietyLower)) {
      return selectedStandard.norms_hoge_norm;
    } else if (selectedStandard.varieties_lage_norm?.some(v => v.toLowerCase() === varietyLower)) {
      return selectedStandard.norms_lage_norm;
    } else if (selectedStandard.norms_overig) {
      return selectedStandard.norms_overig;
    }
    return selectedStandard.norms; // Fallback
  } else if (selectedStandard.type === 'akkerbouw' && selectedStandard.cultivation_rvo_table2 === "Akkerbouwgewassen, mais") {
    if (is_derogatie_bedrijf && selectedStandard.derogatie_norms) {
      return selectedStandard.derogatie_norms;
    } else if (!is_derogatie_bedrijf && selectedStandard.non_derogatie_norms) {
      return selectedStandard.non_derogatie_norms;
    }
    return selectedStandard.norms; // Fallback
  }
  return selectedStandard.norms; // Final fallback return
}

/**
 * Determines the 'gebruiksnorm' (usage standard) for nitrogen based on cultivation, region, and other factors.
 * @param b_lu_catalogue - The BRP cultivation code (e.g., "nl_265").
 * @param latitude - The latitude of the field.
 * @param longitude - The longitude of the field.
 * @param b_lu_end - The termination date of the cultivation.
 * @param is_nv_area - Boolean indicating if the field is in an NV-area.
 * @param b_lu_variety - Optional. The specific variety of the cultivation (e.g., potato variety).
 * @returns The nitrogen usage standard in kg N per hectare, or null if not found.
 */
export function getNL2025StikstofGebruiksNorm(
  b_lu_catalogue: string,
  latitude: number,
  longitude: number,
  b_lu_end: Date,
  is_nv_area: boolean,
  b_lu_variety?: string,
  is_derogatie_bedrijf?: boolean // Added new parameter
): GebruiksnormResult | null {
  // Find matching nitrogen standard data based on b_lu_catalogue_match
  let matchingStandards: NitrogenStandard[] = nitrogenStandardsData.filter(
    (ns: NitrogenStandard) => ns.b_lu_catalogue_match.includes(b_lu_catalogue)
  );

  if (matchingStandards.length === 0) {
    console.warn(`No matching nitrogen standard found for b_lu_catalogue ${b_lu_catalogue}.`);
    return null;
  }

  const region = getRegion(latitude, longitude);

  // Handle specific cases for potatoes based on variety
  // This logic assumes that the b_lu_catalogue for potatoes will match one of the potato entries
  // and then the variety_type will further refine it.
  if (b_lu_variety) {
    const varietyLower = b_lu_variety.toLowerCase();
    const filteredByVariety = matchingStandards.filter(
      (ns: NitrogenStandard) =>
        ns.varieties?.some((v) => v.toLowerCase() === varietyLower)
    );

    if (filteredByVariety.length > 0) {
      matchingStandards = filteredByVariety;
    } else {
      // Fallback to 'overig' if variety not found in high/low lists for potatoes
      const overigPotato = matchingStandards.find(
        (ns: NitrogenStandard) => ns.type === 'aardappel' && ns.variety_type?.includes('overig')
      );
      if (overigPotato) {
        matchingStandards = [overigPotato];
      }
    }
  }

  // Prioritize exact matches if multiple exist (e.g., for specific potato types)
  let selectedStandard: NitrogenStandard | undefined;

  if (matchingStandards.length === 1) {
    selectedStandard = matchingStandards[0];
  } else if (matchingStandards.length > 1) {
    // If multiple standards match b_lu_catalogue, try to find a more specific one
    // This could be based on variety_type for potatoes, or other criteria if added later
    if (b_lu_variety) {
      const varietyLower = b_lu_variety.toLowerCase(); // Define varietyLower here
      const varietySpecific = matchingStandards.find(ns => 
        ns.varieties_hoge_norm?.some(v => v.toLowerCase() === varietyLower) ||
        ns.varieties_lage_norm?.some(v => v.toLowerCase() === varietyLower) ||
        ns.varieties?.some(v => v.toLowerCase() === varietyLower)
      );
      if (varietySpecific) {
        selectedStandard = varietySpecific;
      } else {
         // If variety doesn't match a specific list, check for an "overig" type for potatoes
        const overigPotato = matchingStandards.find(ns => ns.type === 'aardappel' && ns.variety_type?.includes('overig'));
        if (overigPotato) selectedStandard = overigPotato;
      }
    }
    if (!selectedStandard) {
      // If still no specific match, take the first one (or implement more sophisticated disambiguation)
      selectedStandard = matchingStandards.find(ns => !ns.variety_type && !ns.sub_types) || matchingStandards[0];
    }
  }

  if (!selectedStandard) {
    console.warn(`No specific matching nitrogen standard found for b_lu_catalogue ${b_lu_catalogue} with variety ${b_lu_variety || 'N/A'} in region ${region}.`);
    return null;
  }

  const applicableNorms = getNormsForCultivation(selectedStandard, b_lu_variety, is_derogatie_bedrijf, b_lu_end);

  if (!applicableNorms) {
    console.warn(`Applicable norms object is undefined for ${selectedStandard.cultivation_rvo_table2} in region ${region}.`);
    return null;
  }
  
  const normsForRegion: { standard: number; nv_area: number } = applicableNorms[region];

  if (!normsForRegion) {
    console.warn(`No norms found for region ${region} for ${selectedStandard.cultivation_rvo_table2}.`);
    return null;
  }

  let normValue = is_nv_area ? normsForRegion.nv_area : normsForRegion.standard;

  return { normValue: normValue, cultivationNameTabel2: selectedStandard.cultivation_rvo_table2 };
}
