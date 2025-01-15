# FDM App (`fdm-app`)

The `fdm-app` is a React application providing a user-friendly interface for visualizing and managing farm data based on the Farm Data Model (FDM) schema. It utilizes `fdm-core` for seamless database interaction and serves as a practical demonstration of FDM's capabilities.  This intuitive interface empowers users to interact with their farm data, gaining valuable insights and streamlining farm management decisions.

> [!IMPORTANT]  
> `fdm-app` is currently in pre-alpha (v0.x.x). Some features and functionalities are planned for future releases.
> See our [roadmap](https://github.com/SvenVw/fdm/milestones) for planned milestone.

## Key Features

* **Interactive Data Visualization:**  Visualize farm data, including fields, cultivations, fertilizer applications, and soil analysis results, on an interactive map interface. Explore data spatially and gain a comprehensive overview of your farm operations.
* **Streamlined Data Management:**  Manage farm data efficiently through intuitive forms and workflows. Create, update, and delete records for farms, fields, cultivations, fertilizers, and soil analyses with ease.
* **User Authentication and Authorization:** Securely manage user accounts and access control.  Utilize authentication features to protect sensitive farm data. The authentication includes social log in methods.
* **Integration with FDM Core:**  Seamlessly integrates with `fdm-core` for robust data management and access to the standardized FDM schema. Leverages the power and consistency of `fdm-core` for reliable data handling.
* **Open Source and Customizable:**  As an open-source project, `fdm-app` is highly customizable. Adapt the interface, add new features, and tailor the application to meet specific farm management needs.

## Getting Started

1. **Prerequisites:** Ensure you have a PostgreSQL-compatible database set up and configured with the FDM schema (using `fdm-core`). Refer to the `fdm-core` documentation for database setup instructions.

2. **Installation:**

```bash
   pnpm add @svenvw/fdm-app
```

3. **Configuration:** Set the required environment variables, including the database URL, API keys, and other relevant settings. Create a `.env` file in the root directory of your application and copy the values from the `.env.example` file.

4. **Running the App:** 
```bash
    # Development mode
    pnpm dev

    # Production build
    pnpm build
    pnpm start
```    

## Key Functionalities
* **Farm Management:** Create, view, update, and delete farm records, including adding and removing associated fields. Manage farm details and their associated data using the application.
* **Field Management:** Add, edit, and remove fields associated with a farm. Visualize fields on a map, view detailed information about each field, including soil status, and update field properties.
* **Cultivation Management:** Manage cultivations on fields, recording sowing dates and other relevant details. Track the progress of crops and plan future farming activities.
* **Fertilizer Management:** Record fertilizer applications, pick specific fertilizer products for use, and manage fertilizer applications on fields. Track fertilizer usage and optimize application strategies.
* **Soil Analysis Management:** Record and visualize soil analysis results. Track soil health and make informed decisions about fertilization and other management practices

## Contributing
We welcome contributions to enhance the functionality and user experience of `fdm-app`. See the main FDM project documentation for guidelines on contributing code, reporting bugs, and requesting features.

## Made Possible By

FDM is developed by the [Nutriënten Management Instituut](https://www.nmi-agro.nl/) as part of the Horizon Europe projects: [NutriBudget](https://www.nutribudget.eu/) and [PPS BAAT](https://www.handboekbodemenbemesting.nl/nl/handboekbodemenbemesting/pps-baat.htm).


## Contact

Maintainer: @SvenVw
Reviewer: @gerardhros
