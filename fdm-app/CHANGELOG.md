# Changelog MINAS2

## 0.8.2

### Patch Changes

- Replace ESLint with Biome and format the code accordingly
- Updated dependencies
  - @svenvw/fdm-core@0.10.2
  - @svenvw/fdm-data@0.8.2

## 0.8.1

### Patch Changes

- Use the same version for `vite`, `typescript` and `dotenvx` across packages and update those to the latest version
- Updated dependencies
  - @svenvw/fdm-core@0.10.1
  - @svenvw/fdm-data@0.8.1

## 0.8.0

### Minor Changes

- fe29385: Rename path `app` to `farm` and `app/addfarm` to `farm/create`
- fe29385: Add a page `farm` to select from list of farms

  Changes include:

  - Restructured routing: renamed paths from `app/addfarm` to `farm/create`
  - Updated farms table schema:
    - Added: business ID, address, and postal code fields
    - Removed: sector field
  - Added new `getFarms` function for farm management

- fe29385: Add farm settings page and restructure routes

  - Add new farm settings page for managing farm configurations
  - Restructure routes: rename 'app' to 'farm' and 'app/addfarm' to 'farm/create'
  - Add new farm fields: business ID, address, and postal code
  - Improve farm selection interface with time-based greetings

### Patch Changes

- Updated dependencies [520a074]
- Updated dependencies [2171b68]
- Updated dependencies [2171b68]
  - @svenvw/fdm-core@0.10.0
  - @svenvw/fdm-data@1.0.0

## 0.7.0

### Minor Changes

- a2a7fea: Add panels to the atlas-fields component with information about the fields selected and hovered
- a2a7fea: Refactor map page to atlas to improve extensibility
- a2a7fea: Load fields from external flatgeobuffer source instead of an API to improve performance

## 0.6.0

### Minor Changes

- Refactor design `fields` page in `addfarm` and enable to see soil status and update the properties of the field

### Patch Changes

- Updated dependencies [441decd]
- Updated dependencies [71cbba3]
- Updated dependencies [5d0e1f7]
- Updated dependencies [315710b]
  - @svenvw/fdm-core@0.9.0
  - @svenvw/fdm-data@1.0.0

## 0.5.0

### Minor Changes

- 47e2651: Switch to sign in method for authentication including social log in

### Patch Changes

- 83c589b: Upgrade `drizzle-orm` to v0.38.2 and `drizzle-kit` to v0.30.1
- Updated dependencies [83c589b]
- Updated dependencies [6a3e6db]
  - @svenvw/fdm-core@0.8.0
  - @svenvw/fdm-data@0.6.0

## 0.4.0

### Minor Changes

- bee0e62: Add `FertilizerApplicationsForm` to list, add and delete fertilizer applications
- 4112897: Remove selection of fertilizers for acquiring but select all fertilizers

### Patch Changes

- Updated dependencies [7af3fda]
- Updated dependencies [bc4e75f]
- Updated dependencies [a948c61]
- Updated dependencies [efa423d]
- Updated dependencies [b0c001e]
- Updated dependencies [6ef3d44]
- Updated dependencies [61da12f]
- Updated dependencies [5be0abc]
- Updated dependencies [4189f5d]
  - @svenvw/fdm-core@0.7.0
  - @svenvw/fdm-data@1.0.0

## 0.3.1

### Patch Changes

- 9a410b1: Migrated from Remix v2 to React Router v7

## 0.3.0

### Minor Changes

- Implement client-side form validation using Zod for the signup, add farm, and add fields forms.
- Add visual indicators when fields are loading on the map to enhance user experience.

## 0.2.0

### Minor Changes

- e1aa0ee: Rename an app to `Nutriëntenbalans`

### Patch Changes

- bfa7927: Increase width of sidebar on desktop to `18rem`
- 35c55e1: Add example configuration file as `.env.example`
- Updated dependencies [d39b097]
- Updated dependencies [35c55e1]
- Updated dependencies [6694029]
- Updated dependencies [c316d5c]
- Updated dependencies [b1dea77]
- Updated dependencies [d39b097]
- Updated dependencies [49aa60c]
  - @svenvw/fdm-data@1.0.0
  - @svenvw/fdm-core@0.6.0

## 0.1.0

A first prototype of an application for fdm with minimal functions
