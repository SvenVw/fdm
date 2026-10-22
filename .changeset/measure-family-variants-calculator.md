---
"@nmi-agro/fdm-calculator": minor
---

Add `getMeasureFamilyId` and `getBestVariantIds` to group BLN3 measure variants (IDs that differ only in a trailing lowercase letter) into families. `getTopOpportunitiesForField` now keeps only the best variant per family and skips variants of a family that is already active on the field; field measure recommendations in the API follow the same rule.
