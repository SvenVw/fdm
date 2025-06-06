import nitrogenStandardsData from './nitrogen-standards-data.json';

// Define types for the imported data for better type safety
interface NitrogenStandard {
  cultivation_rvo_table2: string;
  b_lu_catalogue_match: string[]; // Changed from b_lu_name_match
  type: string;
  variety_type?: string;
  varieties?: string[];
  norms: {
    klei: { standard: number; nv_area: number };
    zand_nwc: { standard: number; nv_area: number };
    zand_zuid: { standard: number; nv_area: number };
    loss: { standard: number; nv_area: number };
    veen: { standard: number; nv_area: number };
  };
  period_start_month?: number;
  period_start_day?: number;
  period_end_month?: number;
  period_end_day?: number;
  winterteelt_na_31_12?: {
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
}

type RegionKey = 'klei' | 'zand_nwc' | 'zand_zuid' | 'loss' | 'veen';

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
 * Determines the 'gebruiksnorm' (usage standard) for nitrogen based on cultivation, region, and other factors.
 * @param b_lu_brp - The BRP cultivation code (e.g., "nl_265").
 * @param latitude - The latitude of the field.
 * @param longitude - The longitude of the field.
 * @param b_lu_end - The termination date of the cultivation.
 * @param is_nv_area - Boolean indicating if the field is in an NV-area.
 * @param b_lu_variety - Optional. The specific variety of the cultivation (e.g., potato variety).
 * @returns The nitrogen usage standard in kg N per hectare, or null if not found.
 */
export function getGebruiksnormStikstof(
  b_lu_brp: string,
  latitude: number,
  longitude: number,
  b_lu_end: Date,
  is_nv_area: boolean,
  b_lu_variety?: string
): number | null {
  // Find matching nitrogen standard data based on b_lu_catalogue_match
  let matchingStandards: NitrogenStandard[] = nitrogenStandardsData.filter(
    (ns: NitrogenStandard) => ns.b_lu_catalogue_match.includes(b_lu_brp)
  );

  if (matchingStandards.length === 0) {
    console.warn(`No matching nitrogen standard found for b_lu_brp ${b_lu_brp}.`);
    return null;
  }

  const region = getRegion(latitude, longitude);

  // Handle specific cases for potatoes based on variety
  // This logic assumes that the b_lu_brp for potatoes will match one of the potato entries
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
        (ns: NitrogenStandard) => ns.variety_type?.includes('overig')
      );
      if (overigPotato) {
        matchingStandards = [overigPotato];
      }
    }
  }

  // Handle temporary grassland based on b_lu_end date
  if (matchingStandards.some(ns => ns.type === 'grasland_tijdelijk')) {
    const endDate = new Date(b_lu_end);
    matchingStandards = matchingStandards.filter((ns: NitrogenStandard) => {
      if (ns.type === 'grasland_tijdelijk' && ns.period_start_month && ns.period_end_month) {
        const startPeriod = new Date(endDate.getFullYear(), ns.period_start_month - 1, ns.period_start_day);
        const endPeriod = new Date(endDate.getFullYear(), ns.period_end_month - 1, ns.period_end_day);

        // Adjust endPeriod year if it spans across year boundary (e.g., Oct 15 to Dec 31)
        if (ns.period_start_month > ns.period_end_month) {
          endPeriod.setFullYear(endDate.getFullYear() + 1);
        }

        return endDate >= startPeriod && endDate <= endPeriod;
      }
      return false;
    });
  }

  // Prioritize exact matches if multiple exist (e.g., for specific potato types)
  let selectedStandard: NitrogenStandard | undefined;
  if (matchingStandards.length > 1 && b_lu_variety) {
    selectedStandard = matchingStandards.find(ns => ns.variety_type && ns.varieties?.some(v => v.toLowerCase() === b_lu_variety.toLowerCase()));
  }
  if (!selectedStandard && matchingStandards.length > 0) {
    selectedStandard = matchingStandards[0]; // Take the first match if no specific variety match or only one match
  }

  if (!selectedStandard) {
    console.warn(`No specific matching nitrogen standard found for b_lu_brp ${b_lu_brp} with variety ${b_lu_variety || 'N/A'} in region ${region}.`);
    return null;
  }

  const normsForRegion = selectedStandard.norms[region];
  if (!normsForRegion) {
    console.warn(`No norms found for region ${region} for ${selectedStandard.cultivation_rvo_table2}.`);
    return null;
  }

  let normValue = is_nv_area ? normsForRegion.nv_area : normsForRegion.standard;

  // Handle winterteelt values based on b_lu_end
  const endMonth = b_lu_end.getMonth() + 1; // getMonth() is 0-indexed
  const endDay = b_lu_end.getDate();

  if (selectedStandard.winterteelt_na_31_12) {
    // If b_lu_end is after Dec 31 (i.e., in the next year for a winter crop)
    if (endMonth === 1 && endDay >= 1) { // Assuming "na 31/12" means Jan 1 onwards of the next year
      const winterNorms = is_nv_area ? selectedStandard.winterteelt_na_31_12[region].nv_area : selectedStandard.winterteelt_na_31_12[region].standard;
      if (winterNorms !== undefined) {
        normValue = winterNorms;
      }
    }
  } else if (selectedStandard.winterteelt_voor_31_12) {
    // If b_lu_end is before Dec 31 (i.e., in the current year for a winter crop)
    if (endMonth === 12 && endDay <= 31) { // Assuming "voor 31/12" means up to Dec 31 of the current year
      const winterNorms = is_nv_area ? selectedStandard.winterteelt_voor_31_12[region].nv_area : selectedStandard.winterteelt_voor_31_12[region].standard;
      if (winterNorms !== undefined) {
        normValue = winterNorms;
      }
    }
  }

  return normValue;
}
