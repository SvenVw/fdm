---
"@nmi-agro/fdm-calculator": minor
---

Switch the nitrogen mineralization module to the NMI Dyna v2 endpoint and add the building blocks for the redesigned Mineralisatie app: `prepareMineralizationInput` builds the Dyna v2 request for one field and year (only the main cultivation and the green manure or catch crops after it, the selected year's harvests and fertilizer applications), `getDynaV2` runs the cached calculation, `getWeatherForecast` returns the weather forecast for a location, `deriveMineralizationInsights` derives the season phase, key figures, signals and improvement points, and `applyScenarioToRequest`, `diffScenario` and `getMineralizationScenarioSchema` support what-if scenarios. Also adds `getFieldExclusionReason`, which leaves out buffer strips, nature and landscape elements.

**Breaking:** the N-supply integration (`getNSupply`, `requestNSupply`, `buildNSupplyRequest`, `assessDataCompleteness`, `methodRequirements`) and Dyna v1 (`getDyna`, `requestDyna`, `buildDynaRequest`, `dynaResponseDataSchema`) are removed, together with their types.
