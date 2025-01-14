---
"@svenvw/fdm-app": minor
---

Add a page `farm` to select from list of farms

Changes include:
- Restructured routing: renamed paths from `app/addfarm` to `farm/create`
- Updated farms table schema:
  - Added: business ID, address, and postal code fields
  - Removed: sector field
- Added new `getFarms` function for farm management
