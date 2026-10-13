---
"@nmi-agro/fdm-rvo": patch
---

Compare field start and end dates, and the start of the import year, as calendar dates in Europe/Amsterdam, consistent with how fdm-core returns `b_end`. An RVO end date on 1 January now matches a local field that ends on 31 December.
