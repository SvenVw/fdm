# Changelog fdm-app

## 0.13.1

### Patch Changes

- 98e20ac: List other `fdm` packages as `dependencies` instead `peerDependencies` to prevent not needed major version bumps
- Updated dependencies [98e20ac]
  - @svenvw/fdm-calculator@0.2.1
  - @svenvw/fdm-data@0.10.3

## 0.13.0

### Minor Changes

- c5c3dd9: Do not show example values for advice and limit at fertilizer application cards
- 3759d58: Add a card at fertilizer applications with workable nitrogen

### Patch Changes

- 46b9f71: Rename `b_harvesting_date` to `b_lu_harvest_date`
- d9d2b6f: Fix displaying unit of `p_app_amount`
- 649d93b: Rename `b_terminating_date` to `b_lu_end`
- e67cf12: Rename `b_acquiring_date` to `b_start`
- e82a0eb: Improve layout of the fields page at the create farm wizard to show the map better
- 054da12: Fix saving fields details at create farm wizard by using correct format for b_area
- 877a7f1: Remame `b_discarding_date` to `b_end`
- 3e77a90: Fix exception at adding fertilizer applications in create farm wizard
- def1d0b: Rename `b_sowing_date` to `b_lu_start`
- Updated dependencies [4d1dbd9]
- Updated dependencies [4d1dbd9]
- Updated dependencies [0224544]
- Updated dependencies [0b28bd5]
- Updated dependencies [45eda20]
- Updated dependencies [1a295b0]
- Updated dependencies [6a01698]
- Updated dependencies [e312060]
- Updated dependencies [972bac8]
- Updated dependencies [7387530]
  - @svenvw/fdm-core@0.14.0
  - @svenvw/fdm-calculator@1.0.0
  - @svenvw/fdm-data@1.0.0

## 0.12.0

### Minor Changes

- 315125e: Implement the authorization functionalities of fdm-core

### Patch Changes

- 7f4835c: Switch to using auth from fdm-core instead of a separate implementation
- 8306249: Standardize error handling in actions
- 82238cc: Standardize handling errors at loaders
- Updated dependencies [9830186]
- Updated dependencies [06619e7]
- Updated dependencies [da00990]
  - @svenvw/fdm-core@0.13.0
  - @svenvw/fdm-calculator@1.0.0
  - @svenvw/fdm-data@1.0.0

## 0.11.2

### Patch Changes

- Patches for GHSA-vp58-j275-797x and GHSA-hjpm-7mrm-26w8

## 0.11.1

### Patch Changes

- 286adf6: Fix error handling at sign-in page

## 0.11.0

### Minor Changes

- e1fef45: Add Microsoft OAuth2 sign-in method alongside existing Google authentication
- 33b8b59: Show at fertilizer application form the nutrient doses
- e1fef45: At the sign-in page, use a card to present sign-in methods including Microsoft and Google.
- 0bbf9c2: Add redirect to first field at fields page in create farm wizard
- d61a487: Redirect to first cultivation at the transition from fields to cultivationplan at the create farm wizard
- 1eef110: Add a feedback form
- 1ebb30c: Add ErrorBoundary to catch errors and redirect user to error page
- 1eef110: Add telemetry to Sentry
- 1ebb30c: Add styled error pages to provide users an informative message about what happened

### Patch Changes

- 920f166: Drop use of `wkx`
- ac07a8b: Improve layout of fieds page with cards at create farm wizard
- Updated dependencies [475986f]
- Updated dependencies [5d2871e]
- Updated dependencies [644a159]
- Updated dependencies [2508042]
- Updated dependencies [e518d78]
- Updated dependencies [9e05058]
- Updated dependencies [d2a2ab7]
- Updated dependencies [1b435a3]
- Updated dependencies [488f898]
- Updated dependencies [ed82ff6]
- Updated dependencies [d2a2ab7]
- Updated dependencies [aede4a7]
- Updated dependencies [9e6f2d7]
- Updated dependencies [644a159]
  - @svenvw/fdm-calculator@1.0.0
  - @svenvw/fdm-core@0.12.0
  - @svenvw/fdm-data@1.0.0

## 0.10.1

### Patch Changes

- Patch for GHSA-9x4v-xfq5-m8x5

## 0.10.0

### Minor Changes

- 93dd8e7: Add `Atlas` for farm page to show maps at the farm level (currently only fields is supported)

### Patch Changes

- 93dd8e7: Refactored the Atlas components to make them more flexible and readable

## 0.9.1

### Patch Changes

- 638b34e: Fix adding a new cultivation to a field
- 15a52e1: Fix clicking in log out button
- Updated dependencies [bc52f62]
- Updated dependencies [9b53632]
  - @svenvw/fdm-core@0.11.3
  - @svenvw/fdm-data@0.9.0

## 0.9.0

### Minor Changes

- Add fields overview page of farm
- Add page with details of a field

### Patch Changes

- 72af577: Fixes build of `fdm-app` by targetting ES2022
- Updated dependencies [341b0a3]
- Updated dependencies [0d97679]
- Updated dependencies [f7d7a50]
- Updated dependencies [899b99c]
- Updated dependencies [f7d7a50]
- Updated dependencies [c584d5a]
- Updated dependencies [f7d7a50]
- Updated dependencies [073b92e]
  - @svenvw/fdm-core@0.11.0
  - @svenvw/fdm-data@1.0.0

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
