# FDM Data (`fdm-data`)

The `fdm-data` package extends the Farm Data Model (FDM) core functionality by providing predefined catalogues of data records, such as fertilizers and cultivations. This streamlines data entry and ensures consistency by allowing users to select from existing catalogues or easily create their own.

## Key Features

* **Predefined Catalogues:** `fdm-data` includes ready-to-use catalogues for common agricultural data, such as fertilizers and cultivations, saving time and effort in data entry.
* **Extensible Catalogues:** Easily extend the provided catalogues or create custom catalogues to accommodate specific needs and regional variations.  This allows you to tailor the data model to your exact requirements.
* **Simplified Data Entry:** Using predefined catalogues simplifies data entry and reduces errors by providing standardized options for common data points.  This contributes to cleaner and more reliable data.
* **Data Consistency:** Catalogues enforce consistent terminology and data structures, improving data quality and facilitating analysis.
* **Seamless Integration:**  `fdm-data` integrates seamlessly with `fdm-core`, providing a unified experience for managing and analyzing farm data.

## Getting Started

1. **Installation:**

```bash
   pnpm add @svenvw/fdm-data
```
2. **Integration:** Import `fdm-data` into your application along with `fdm-core`. The catalogues are designed to work directly with the core FDM schema. Refer to the documentation for specific usage examples

## Key Functionalities
* **extendFertilizersCatalogue:** Extends the fertilizers_catalogue table in your database with data from various sources (currently only SRM is supported). This function allows you to use a set of predefined fertilizers or to make use of your own list of fertilizers.
* **extendCultivationsCatalogue:** Extends the cultivations_catalogue table with data from sources like BRP. This allows for a comprehensive selection of predefined cultivations within the FDM system.

## Supported Catalogues
* **Fertilizers:** Includes a comprehensive list of common fertilizer types, with detailed information on their composition. Supports multiple data sources and is designed to be extensible.
* **Cultivations:** Includes catalogues for crops and other cultivations, facilitating standardized tracking and management of these data within your FDM implementation.

## Contributing
We welcome contributions to expand and improve the provided catalogues. See the main FDM project documentation for guidelines on contributing code, reporting bugs, and requesting features. Adding new catalogues or updating existing data is a valuable way to contribute to the project.

## Made Possible By
FDM is developed by the [Nutriënten Management Instituut](https://www.nmi-agro.nl/) as part of the Horizon Europe projects: [NutriBudget](https://www.nutribudget.eu/) and [PPS BAAT](https://www.handboekbodemenbemesting.nl/nl/handboekbodemenbemesting/pps-baat.htm).

## Contact
Maintainer: @SvenVw
Reviewer: @gerardhros