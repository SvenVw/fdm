---
title: "Catalogues"
---

# Farm Data Model (FDM) Catalogues

FDM Catalogues provide standardized lists of common agricultural inputs and practices, simplifying data entry and ensuring consistency across different farms and datasets. These catalogues act as controlled vocabularies, offering pre-defined options for various data fields.

## Catalogue Structure
Each catalogue is structured as a table within the FDM database. Each entry in the catalogue represents a specific item or practice, along with relevant attributes that describe it. This structured approach allows for efficient querying and analysis of data related to the catalogued items.

### Fertilizers Catalogue
The `fertilizers_catalogue` table contains a catalogue of fertilizers. This catalogue helps standardize how information about is recorded within the FDM.

### Cultivations Catalogue
The `cultivations_catalogue` table contains a catalogue of possible cultivations. This catalogue ensures consistent recording of cultivation activities, simplifying analysis of field management practices.

## Extending Catalogues
The FDM is designed for extensibility. You can add custom entries to the existing catalogues or create entirely new catalogues to accommodate specific farm inputs or practices not covered by the standard catalogues. This flexibility ensures the FDM can adapt to the diverse needs of different agricultural systems. For example, you might create a catalogue for different types of fertilizers or cultivations. When extending catalogues, it's important to maintain the overall structure and data types used in the standard catalogues to ensure data consistency and interoperability.