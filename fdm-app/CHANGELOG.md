# Changelog fdm-app

## 0.21.0

### Minor Changes

- db525fc: Enable uploading a Mijn Percelen shapefile instead of selecting fields on the atlas page.
- 99aec54: At farm create wizard for Bouwplan improve list of cultivations and provide more information as number of fields and total area
- c3f1454: Replace the options for `b_acquiring_method` with the new options following RVO specification
- ce5fcdb: At field properties add a section to delete a field
- fcfc84e: Improved design of fertilizer application pages by combining various components into a single card
- b7d95e0: Add for pages with calculations (.e.g., nutrient advice, norms and balance) placeholders with skeletons so that user sees the page already and is notified that the content will arrive shortly
- 99aec54: At farm create wizard for Bouwplan split Gewassen en Bemesting in 2 seperate pages instead of tabs
- 5708973: Add new app `Gebruiksnormen` to show legal norms at farm and field level
- d5fb186: Allow selecting a non-current year in the farm-creation wizard
- 65fb0ed: Add an option in the farm-creation wizard to specify the start year of a farm’s derogation
- e6a9d4e: Add page to manage derogation for a farm
- 99aec54: Overhaul the pages with cultivation and harvests to enable users to quickly select a cultivation, get the details and list of harvest and enable to open dialogs to add new cultivations and harvests
- 0c367ea: Add delete field button at fields page in Farm Create Wizard

### Patch Changes

- db5e7fe: Update dependencies
- 94250d9: Fixes incorrect unit description of `b_lu_n_harvestable`
- ec3c5c8: Fix metadata of "New field" page
- Updated dependencies [52e0959]
- Updated dependencies
- Updated dependencies [0f8e4eb]
- Updated dependencies [db5e7fe]
- Updated dependencies [6821ee9]
- Updated dependencies
- Updated dependencies [b502367]
- Updated dependencies [b40cffa]
- Updated dependencies [cbf5340]
- Updated dependencies [51722cc]
- Updated dependencies [f19238b]
- Updated dependencies [2ac1471]
  - @svenvw/fdm-core@0.23.0
  - @svenvw/fdm-calculator@0.5.0
  - @svenvw/fdm-data@0.15.0

## 0.20.4

### Patch Changes

- f589317: Fix storing additional soil parameters when adding a new field (not in the farm create wizard)

## 0.20.3

### Patch Changes

- 4f25214: Fixes exception when adding a harvest in farm create wizard

## 0.20.2

### Patch Changes

- e8aceb2: Fix missing "continue" button on Bouwplan page in Farm Create Wizard

## 0.20.1

### Patch Changes

- 4e8c707: Fix showing emission values at nitrogen balance chart
- f942466: Fix saving form when parameter is of type Date, not filled in and optional
- Updated dependencies [ffd1b3e]
- Updated dependencies [7c36ecc]
- Updated dependencies [3e73281]
  - @svenvw/fdm-data@0.14.1
  - @svenvw/fdm-calculator@0.4.1
  - @svenvw/fdm-core@0.22.1

## 0.20.0

### Minor Changes

- b1301fa: Add nutrient advice as new application
- f548dea: Add the ability to upload a pdf with a soil analysis, extract the values and save it
- 3f79b0e: Display the application method for each fertilizer application in the list
- 32aefb9: Add to interactive maps a search bar as control to lookup addresses and navigate them to
- be6469f: Combine datepickers into a single component and include new features as dropdown selection of year and month and text input
- 36803f1: Add a feature to select an existing fertilizer as a template for new fertilizers
- 2fb2db3: Improve the design of the fertilizer form page by making it more intuitive and clear.
- 5f9e9e0: Add an application-method field to the fertilizer-application form
- c865f44: In the nitrogen balance, show the total amount of ammonia emitted and provide field-level details.
- 6a42aa0: For new farms use the `baat` catalogue for fertilizers instead of `srm`

### Patch Changes

- c962751: Replace the `p_type_*` boolean flags with the unified `p_type` field across all fertilizer functions
- 691af1d: Update and migrate to next version of radix-ui
- 14e57e6: Update to tailwind v4
- 14e57e6: Update to react 19
- Updated dependencies [ce5ffa8]
- Updated dependencies [b6721b4]
- Updated dependencies [955f854]
- Updated dependencies [093784b]
- Updated dependencies [e37b6f0]
- Updated dependencies [780e8c4]
- Updated dependencies [ac05d8b]
- Updated dependencies [7f95233]
- Updated dependencies [5d0a80b]
- Updated dependencies [a58b367]
- Updated dependencies [afe2a32]
- Updated dependencies [fbbdc57]
- Updated dependencies [e6c0fa3]
- Updated dependencies [2c6251c]
- Updated dependencies [75693e4]
- Updated dependencies [a898e30]
  - @svenvw/fdm-core@0.22.0
  - @svenvw/fdm-calculator@0.4.0
  - @svenvw/fdm-data@0.14.0

## 0.19.6

### Patch Changes

- f2b1fc6: Fixes redirects at harvest details page
- Updated dependencies [94a82f6]
  - @svenvw/fdm-calculator@0.3.3

## 0.19.5

### Patch Changes

- a3ede17: Redirect all subdomains, except .dev, to original hostname

## 0.19.4

### Patch Changes

- 59723e9: Make content parameters optional when adding a custom fertilizer
- 3bd7ca5: Fix exception in fertilizer application form when no fertilizer is selected
- 4c34442: Fix disabling of the update field form in the create farm wizard during submission
- e199f76: Fix visibility of custom fertilizers in the fertilizer list
- 3009a33: Fix exception in the update field form in the farm creation wizard

## 0.19.3

### Patch Changes

- db2f2cb: Make the ChevronDown icon in header less prominent
- e4f70cf: Make more clear that buttons in the sidebar with no action are not clickable
- 885588e: Show absolute values at balance chart
- efa12f6: Do not show dropdown menu if no options are provided
- 046fdd2: Fix dead link for `Bedrijf` at '/farm' page
- 40cf4b6: At nitrogen balance details for field show harvest date and link to harvest page instead of harvest id
- 7711209: Fix redirect after successful harvest form submission

## 0.19.2

### Patch Changes

- 284f17a: Fix hydration error

## 0.19.1

### Patch Changes

- a452ac8: Fix various validation issues at soil analysis form
- bc2b796: Remove the incorrect nitrogen limit value from fertilizer application cards
- 3f5fd9a: Clear value for p_app_amount on fertilizer application form after successful submission
- ad75270: Fix exception when clicking on a field to add a new field
- Updated dependencies [8cb4399]
  - @svenvw/fdm-core@0.21.1
  - @svenvw/fdm-calculator@0.3.2

## 0.19.0

### Minor Changes

- a963506: Redirect users with incomplete profiles to the welcome page
- 004c58d: Add option to sign in with magic-link
- 4db6f37: Redirect new users to welcome page (if no redirect is provided) to complete their profile

### Patch Changes

- aba0f81: Add tags to emails
- 050f170: Fix showing avatar image at dropdown menu
- c1ad4b7: Fix loading public environment variables on the server side by using the correct prefix
- Updated dependencies [004c58d]
- Updated dependencies [7b447f6]
- Updated dependencies [7b447f6]
- Updated dependencies [842aac4]
  - @svenvw/fdm-core@0.21.0
  - @svenvw/fdm-calculator@0.3.1

## 0.18.2

### Patch Changes

- 2d163bf: Public environmentals that are used client-side are now set at runtime instead of buildtime
- 7bde06a: Rename prefix of public environmentals from `VITE_` to `PUBLIC_`

## 0.18.1

### Patch Changes

- 8d36091: Fix button to update cultivation will not redirect to 404 page but update the values
- 497343c: Fix that max for `b_lu_yield` is 100000 instead of 100
- 03de714: Fix that values in cultivation form update when selecting a different cultivation at cultivation plan

## 0.18.0

### Minor Changes

- a07adde: Show a comparison of the nitrogen balance with the target level on both farm and field pages
- ceb72eb: Implement core organization management features, including creation, listing, user invitations, and invitation management.
- e870059: Add block to enable sharing of farm to other users and organizations
- 58c2a56: Add `a_nmin_cc` to nmin soil analysis
- 8303ad7: For the source of the soil analysis, users can now choose from a list of sources instead of a text field
- f1cb0bc: Rename Kaart to Atlas and move to apps
- ca0d61b: Add a platform sidebar that helps the user to navigate all the platform related things, like account management, settings, organizations etc.
- 2771859: Add new soil parameters to soil analysis: `a_n_rt`, `a_c_of`, `a_cn_fr` and `a_density_sa`
- b9ecbe6: Expand integration with NMI to include more soil parameters: `a_al_ox`, `a_ca_co`, `a_ca_co_po`, `a_caco3_if`, `a_cec_co`, `a_cn_fr`, `a_com_fr`, `a_cu_cc`, `a_fe_ox`, `a_k_cc`, `a_k_co`, `a_k_co_po`, `a_mg_cc`, `a_mg_co`, `a_mg_co_po`, `a_n_pmn`,`a_p_ox`, `a_p_rt`, `a_p_sg`, `a_p_wa`, `a_ph_cc`, `a_s_rt`, `a_sand_mi`, `a_silt_mi`, `a_zn_cc`
- ff08686: Add the ability to select a type of soil analyses so that a subset of parameters can be shown at the form
- ed226af: Redesign the page on which the farm can be selected by providing a card with some details for every farm
- 6b21513: Show a bar chart on the nitrogen balance pages for farms and fields to compare supply, removal, and emission

### Patch Changes

- 971e813: Use configurable link to open a new page with the privacy policy
- 92a1098: When another field of farm is selected in the page header, it does not redirect you anymore to the start page of farm or field, but reloads tthe current page with the new selected field or farm
- 63a4cea: Move what's new page to about section
- 13210e6: Limit that each harvest can have only 1 harvestable and not multiple
- 6dfba80: Redirect unauthenticated users to their originally requested page after sign-in.
- Updated dependencies [e260795]
- Updated dependencies [0dc93fd]
- Updated dependencies [5a3bf78]
- Updated dependencies [c44812f]
- Updated dependencies [cf399ca]
- Updated dependencies [249138c]
- Updated dependencies [119c328]
- Updated dependencies [f05e1cb]
- Updated dependencies [9a5be3b]
- Updated dependencies [6292cf3]
- Updated dependencies [f05e1cb]
- Updated dependencies [286abb9]
- Updated dependencies [bdf0cb0]
- Updated dependencies [343c580]
- Updated dependencies [ef8a2c6]
- Updated dependencies [119c328]
- Updated dependencies [e260795]
- Updated dependencies [ba3801c]
- Updated dependencies [13210e6]
- Updated dependencies [c122c66]
- Updated dependencies [18f195b]
- Updated dependencies [a550805]
- Updated dependencies [7e881c1]
- Updated dependencies [d4a7e02]
- Updated dependencies [e0a779c]
- Updated dependencies [c44812f]
- Updated dependencies [dd7bb7b]
- Updated dependencies [ec0494c]
- Updated dependencies [0a546d4]
- Updated dependencies [ec0494c]
- Updated dependencies [6676992]
- Updated dependencies [4027c9a]
  - @svenvw/fdm-core@0.20.0
  - @svenvw/fdm-calculator@0.3.0

## 0.17.2

### Patch Changes

- e569e34: Fix loading of `farm/create/$b_id_farm/$calendar/fields` page
- b2ae7ad: Change behavior so that hitting the enter button at `farm/create` submits the form instead of navigating back

## 0.17.1

### Patch Changes

- 516784b: Fixes client side configuration by providing at build stage
- Updated dependencies [eed1780]
  - @svenvw/fdm-core@0.19.0
  - @svenvw/fdm-calculator@0.2.6

## 0.17.0

### Minor Changes

- 05bc116: Add titles and descriptions to pages
- 694fff5: Replace placeholder with FDM logo
- 694fff5: Use FDM logo for favicon
- 901be37: Redesigned the soil component on the field page of the Create Farm Wizard
- b5afe8b: Add page to show the list of fertilizers available on the farm
- 800feaa: Add `Kalender` to sidebar. This enables users to filter assets and actions based on the selected year or to show all of them.
- 199cba4: Add a message at signin page that the app is still in development
- b5afe8b: Add page to show details of a fertilizer, and if applicable, to update the values
- 542f55b: When farm is created enable fertilizer catalogue with custom fertilizers for that specific farm
- 34113b1: Add page to add a field to a farm
- cc66860: Add ability to perform a new soil analysis in the Create Farm Wizard
- dedef47: After registration send the user a welcome email
- b5afe8b: Add page to add new fertilizer for a farm
- 8e17182: Make fdm-app configurable for various settings, including the name
- 901be37: Improve layout of the fields page in the Create Farm Wizard
- 33434c6: Add analytics by integrating posthog

### Patch Changes

- 5f81d42: Allow display of Microsoft profile picture
- b06b809: Do not build sourcemaps at production
- 7b86f47: Fix rendering harvest list page and harvest detail page at create farm wizard
- 7d8527c: Allow display of Google profile picture
- 0318a4c: Users are now automatically redirected to the sign-in page when encountering a 401 error.
- 4d049ce: Fixes unit of `b_lu_yield` to be same as in `fdm-core`, i.e. kg DS / ha
- 917b36b: Improve bundle by manually chunking
- d380f66: Refactored farm context into using a zustand store
- be9bf5b: Disable sidebar links during create farm wizard
- dedef47: Add email integration with Postmark, including:
  - New environment variables for Postmark configuration
  - Integration with Postmark API for sending transactional emails
  - Support for HTML email templates
- Updated dependencies [c240486]
- Updated dependencies [e9926cb]
- Updated dependencies [82f4767]
- Updated dependencies [a52796a]
- Updated dependencies [9ea6795]
- Updated dependencies [a259ff6]
- Updated dependencies [01081b3]
- Updated dependencies [d693cdb]
- Updated dependencies [0944ef1]
- Updated dependencies [175ea6a]
- Updated dependencies [9f4d818]
  - @svenvw/fdm-core@0.18.0
  - @svenvw/fdm-calculator@0.2.5

## 0.16.0

### Minor Changes

- 7ec422b: Improve the links in the sidebar. Activate them when the farm is selected
- df5b29d: Add mailto link at `Ondersteuning` in sidebar
- e093565: Deactivate the button to add a new field
- 9877b9c: Add "what's new" page
- bd84340: Deactivate links in sidebar to `Nutrientenbalans`, `OS Balans` and `BAAT`
- e36c466: Remove links in the sidebar to `Meststoffen`, `Gewassen` and `Stal & Dieren`
- d062979: Add page with account details

### Patch Changes

- 932c410: Fixes at the fields page in the create farm wizard the values in the form change when another field is selected
- d20d1db: Improve and standardize the handling of avatar initials
- a13b971: Fix CSP setting for requesting field geometries from Google Cloud Storage
- Updated dependencies [9bfd0a8]
  - @svenvw/fdm-core@0.17.0
  - @svenvw/fdm-calculator@0.2.4

## 0.15.0

### Minor Changes

- c399b8b: Add `docker-compose.yml` for instructions to run `fdm-app` together with a database
- c399b8b: Add docker file to build image for `fdm-app`
- a5f5c3b: Add cache control settings and setting security headers

### Patch Changes

- Updated dependencies [e134cfc]
  - @svenvw/fdm-core@0.16.0
  - @svenvw/fdm-calculator@0.2.3

## 0.14.0

### Minor Changes

- 89ce485: Show only cultivation and fertilizers from catalogues that are enabled

### Patch Changes

- 121edf9: Add that the `srm` and `brp` catalogues are enabled
- 2fd9dc8: Use the `syncCatalogues` function to replace `extendFertilizersCatalogue` and `extendCultivationsCatalogue` functions
- d7bbdf9: Remove dependency on `fdm-data`
- Updated dependencies [b601b5f]
- Updated dependencies [9b1f522]
- Updated dependencies [f056396]
- Updated dependencies [cdb1d02]
- Updated dependencies [9a6e329]
  - @svenvw/fdm-core@0.15.0
  - @svenvw/fdm-calculator@0.2.2

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
