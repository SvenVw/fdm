# MINAS2 Fork of FDM: Transforming Farm Data into Actionable Insights

This repository represents the MINAS2 fork of the Farm Data Model (FDM) project. The Farm Data Model (FDM) is an open-source project designed to empower data-driven decision-making in agriculture.  By providing a standardized, flexible, and extensible schema for organizing and analyzing farm data, FDM enables seamless data integration, analysis, and ultimately, improved farm management practices and lowering environmental impact.

<img src="/fdm-docs/static/img/fdm-high-resolution-logo.png" alt="FDM Logo" height="250px">

## Key Features & Benefits  (Inherited from FDM)

* **Standardized Schema:** FDM's core strength lies in its robust, well-defined schema.  This structure ensures consistency and interoperability, allowing diverse agricultural data sources to seamlessly integrate and communicate. This structured approach facilitates easier data analysis and exchange between different farm management systems and platforms.
* **Single Source of Truth:**  FDM adheres to the principle of a single source of truth, meaning that each piece of information is stored in only one place within the schema. This eliminates data conflicts and inconsistencies, ensuring data integrity and reliability.
* **Asset-Action Model:** FDM utilizes an intuitive "Asset-Action" model, where "Assets" represent physical or conceptual entities like fields, crops, or equipment, and "Actions" represent operations or events related to these assets, such as sowing, fertilizing, or harvesting. This clear separation provides a granular view of farm activities and their impact.
* **Hierarchical Structure:**  Data is organized hierarchically within the schema, allowing for logical grouping and efficient querying.  This facilitates a deeper understanding of relationships between different data points, enabling more insightful analysis.
* **Extensibility:**  While standardized, FDM is also highly extensible. Users can add custom attributes and actions to cater to specific needs without compromising the overall schema's integrity. This flexibility makes FDM adaptable to the diverse and evolving landscape of modern agriculture.
* **Open-Source Collaboration:**  Developers, agronomists, and other interested individuals are encouraged to contribute, fostering innovation and ensuring the project remains relevant and robust.
* **Data-Driven Decisions:**  Ultimately, FDM empowers farmers and agronomists to make data-driven decisions. By providing a clear framework for data analysis, FDM supports optimized resource allocation, improved crop management strategies, lower environmental impact and enhanced overall farm productivity.

## MINAS2 Specific Adaptations

This fork, developed specifically for the MINAS2 project, builds upon the foundation of FDM with key adaptations:

* **Branding and User Interface:**  MINAS2 incorporates distinct branding, including a unique logo, color scheme, and other visual elements to differentiate it from the original FDM project.
* **Telemetry and Usage Reporting:**  Enhanced telemetry features provide valuable insights into system usage and performance, enabling developers to optimize the platform for MINAS2's specific needs.  Error reporting mechanisms are also integrated to facilitate troubleshooting and improve stability.
* **Planned Integrations:**  Future development plans include integrating MINAS2 with external systems such as RVO (Rijksdienst voor Ondernemend Nederland), streamlining data exchange and compliance reporting.  This will provide seamless access to crucial agricultural data and resources directly within the MINAS2 platform.

This section will be updated as further MINAS2-specific features and functionalities are implemented.

## FDM Ecosystem: A Modular Approach

FDM comprises several interconnected packages, each serving a distinct purpose:

* **`fdm-core`:** The foundation of FDM, providing the core data schema and functions for interacting with it. A TypeScript library designed for seamless integration into various applications. Directly interacts with your database, managing all CRUD operations.

* **`fdm-data`:** Extends `fdm-core` with pre-defined catalogues of data records (fertilizers, cultivations). Users can select from existing catalogues or easily create their own, streamlining data entry and ensuring consistency.

* **`fdm-calculator`:**  (planned) This package will enable domain-specific calculations based on the data stored within the FDM schema, providing valuable insights and decision support tools.

* **`fdm-app`:** A React application offering a user-friendly interface for visualizing and managing farm data.  Utilizes `fdm-core` for database interaction and provides a practical demonstration of FDM's capabilities.

* **`fdm-docs`:** Houses the comprehensive documentation for the entire FDM project.

## Getting Involved

We welcome contributions to the MINAS2 fork of FDM!  Please focus contributions here on MINAS2-specific changes, such as:

* **MINAS2 Integrations:**  Code related to integrating with RVO or other MINAS2-specific services.
* **UI/UX Enhancements:** Improvements to the user interface and user experience specific to the MINAS2 branding and requirements.
* **MINAS2-Specific Features:**  Implementation of new features exclusively for MINAS2.
* **Bug Fixes and Performance Improvements:** Addressing issues and optimizing performance within the MINAS2 context.

For general FDM enhancements or bug fixes that are not specific to MINAS2, please contribute directly to the upstream FDM repository.  This helps maintain a clear separation between the core FDM project and the MINAS2 customizations.  Clear and concise commit messages are appreciated.  If you have questions, open an issue on the repository and we are happy to assist you! 

## Made Possible By

This fork is based on FDM, developed by the [Nutriënten Management Instituut](https://www.nmi-agro.nl/) as part of the Horizon Europe projects: [NutriBudget](https://www.nutribudget.eu/) and [PPS BAAT](https://www.handboekbodemenbemesting.nl/nl/handboekbodemenbemesting/pps-baat.htm). 

<img src="https://www.nutribudget.eu/wp-content/themes/nutribudget/images/logo-nutribudget.png" alt="NutriBudget Logo" height="250px">
<img src="https://www.beterbodembeheer.nl/wp-content/uploads/2024/01/pps-baat-projectlogo.png" alt="PPS BAAT Logo" height="250px">
<img src="https://ec.europa.eu/regional_policy/images/information-sources/logo-download-center/eu_funded_en.jpg" alt="EU Logo" height="300px">
<img src="https://media.licdn.com/dms/image/C560BAQEYGcm4HjNnxA/company-logo_200_200/0?e=2159024400&v=beta&t=u40rJ7bixPWB2SAqaj3KCKzJRoKcqf0wUXCdmsTDQvw" alt="NMI Logo" height="250px">


## Contact
Maintainer: @SvenVw
Reviewer: @gerardhros