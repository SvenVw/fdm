---
"@nmi-agro/fdm-core": patch
---

Fix fields and measures that end exactly at the start of a calendar year still being returned for that year:

- `b_end` and `m_end` are stored as entered. When fields and measures are read (`getField`, `getFields`, `updateField`, `getMeasure`, `getMeasures` and `getMeasuresForFarm`), an end date on 1 January (Europe/Amsterdam) is returned as the end of 31 December of the previous year. Ending a field or measure on 31 December or on 1 January therefore gives the same result, and it is no longer returned for the next calendar year.
- A measure ended on 1 January no longer overlaps a measure of the same type that starts on 1 January.
- Add `adjustEndDateAtYearStart`, `toFdmDateString`, `startOfDayInFdmTimeZone` and `FDM_TIME_ZONE`.
