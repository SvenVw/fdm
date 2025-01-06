---
sidebar_position: 1
title: Introduction to FDM
---

The Farm Data Model (FDM) provides a robust and flexible framework for organizing and analyzing agricultural data. Designed with both developers and agronomists in mind, FDM-core offers a standardized schema for representing diverse farm information, enabling seamless data integration, analysis, and decision-making.

FDM adopts an "Asset-Action" model as its core architectural principle. This model centers around two key concepts: Assets represent physical or conceptual entities within a farm, such as fields, crops, or equipment. Actions, on the other hand, represent operations or events related to these assets, such as planting, fertilizing, or harvesting. This clear separation allows for a granular understanding of farm activities and their impact on different assets.

The FDM schema further structures data using a hierarchical approach. This allows for logical grouping and efficient querying. For example, a "field" asset might contain information about its boundaries and connects to various actions where it associated with. Thesea associated actions, like "fertilizer application," include details like date, type of fertilizer, and application rate.

This structured schema ensures data consistency and facilitates interoperability between different farm management systems. By adhering to the FDM schema, developers can build applications that seamlessly integrate with existing farm data, while agronomists can gain valuable insights from standardized data across multiple farms. FDM-core is designed for extensibility, allowing users to add custom attributes and actions to cater to specific needs while maintaining overall schema consistency. This balance of standardization and flexibility ensures FDM can adapt to the evolving needs of modern agriculture.

Key benefits of using the FDM include:

* Improved Data Management: Standardizing data collection and storage through a well-defined schema simplifies data management and analysis.
* Enhanced Interoperability: Facilitates data exchange between different systems and platforms, enabling a holistic view of farm operations.
* Data-Driven Decision Making: Provides a structured framework for analyzing farm data, enabling informed decisions related to resource allocation, crop management, and overall farm productivity.
* Scalability and Extensibility: The FDM is designed to handle large datasets and can be extended to accommodate new data types and farm practices.

This introduction lays the groundwork for a deeper dive into specific components of the FDM schema. Subsequent sections will delve into the details of Assets and Actions, providing concrete examples and illustrating the practical applications of the FDM in various agricultural scenarios.