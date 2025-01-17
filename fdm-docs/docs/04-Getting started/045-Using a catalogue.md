---
title: "Using Catalogues"
---

# Working With Catalogues
The concept of catalogues in FDM is explained in detail in [Core Concepts > Catalogues](../03-Core%20concepts/033-Catalogues.md "Catalogues concept page"). Here we demonstrate how to access data from a catalogue and extend catalogues with your own data. On this page, we will work with the **cultivations** catalogue.


## Accessing Catalogues
With the ``getCultivationsFromCatalogue`` function, an array of cultivations can be accessed. One only needs to supply the correct FDM instance to the function. If you haven't previously added anything to the catalogue, the array is currently empty.

```typescript title="Example of using getCultivationsFromCatalogue"
const cultivations = await getCultivationsFromCatalogue(fdm = "myFDM");
console.log('Available cultivations:', cultivations);
````

## Extending Catalogues
There are two methods to add cultivations to this catalogue.

1. Add data to your catalogue from an existing source catalogue using the ``extendCultivationsCatalogue`` function.

2. Add data to your own specifications using the ``addCultivationToCatalogue`` function.

### Extending with an existing source
The ``extendCultivationsCatalogue`` function requires one to specify the instance of FDM to modify and the name of a catalogue to add.

```typescript title="Example of extending your catalogue with the brp catalogue"
extendCultivationsCatalogue(fdm = "MyFDM", catalogueName = "brp")
```

### Extending with a novel cultivation
To add data to the catalogue yourself, you can use the ``addCultivationToCatalogue`` function. The data you add must adhere to the [cultivationsCatalogue Schema](../03-Core%20concepts/032-Schema.md#cultivationscatalogue "Table of the cultivationsCatalogue").

```typescript title="Example of extending your catalogue with a cultivation of your specifications"
addCultivationToCatalogue(
    fdm = "myFDM",
    properties = {
        b_lu_catalogue: "cultivationId123",
        b_lu_source: "myOwnCatalogue",
        b_lu_name: "Wild kattenkruid",
        b_lu_name_en: "catnip",
        b_lu_hcat3: "3301061212",
        b_lu_hcat3_name: "catnip"
    }
)
```
