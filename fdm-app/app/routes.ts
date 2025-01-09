import {
    type RouteConfig,
    route,
    index,
    layout,
    prefix,
} from "@react-router/dev/routes";

export default [

    // Homepage
    index("./routes/index.tsx"),

    // Sign in page
    route("signin", "./routes/signin.tsx"),

    // Authenticated user part
    layout("./routes/layout.tsx", [
        ...prefix("farm", [

            // Not selected a farm
            index("./routes/farm/index.tsx"),

            // Selected a farm
            ...prefix(":b_id_farm", [
                layout("./routes/farm/_b_id_farm/layout.tsx", [
                    index("./routes/farm/_b_id_farm/index.tsx"),

                    // Settings of a farm
                    ...prefix("settings", [
                        layout("./routes/farm/_b_id_farm/settings/layout.tsx", [
                            index("./routes/farm/_b_id_farm/settings/index.tsx"),
                            route("properties", "./routes/farm/_b_id_farm/settings/properties.tsx"),
                            route("access", "./routes/farm/_b_id_farm/settings/access.tsx"),
                            route("delete", "./routes/farm/_b_id_farm/settings/delete.tsx"),
                        ]),
                    ])
                ])
            ]),

            // Wizard to create a new farm
            ...prefix("create", [

                // Create farm page
                index("./routes/farm/create/index.tsx"),
                ...prefix(":b_id_farm", [
                    index("./routes/farm/create/_b_id_farm/index.tsx"),

                    // Select fields on map page
                    route("atlas", "./routes/farm/create/_b_id_farm/atlas.tsx"),

                    // Fill in the properties of fields pages
                    ...prefix("fields", [
                        index("./routes/farm/create/_b_id_farm/fields/index.tsx"),
                        ...prefix(":b_id", [
                            layout("./routes/farm/create/_b_id_farm/fields/layout.tsx", [
                                index("./routes/farm/create/_b_id_farm/fields/_b_id.tsx")
                            ])
                        ]),
                    ]),

                    // Fill in the properties per cultivation
                    ...prefix("cultivations", [
                        index("./routes/farm/create/_b_id_farm/cultivations/index.tsx"),
                        layout("./routes/farm/create/_b_id_farm/cultivations/layout.tsx", [
                            ...prefix(":b_lu_catalogue", [
                                layout("./routes/farm/create/_b_id_farm/cultivations/_b_lu_catalogue/layout.tsx", [
                                    index("./routes/farm/create/_b_id_farm/cultivations/_b_lu_catalogue/index.tsx"),
                                    route("covercrop", "./routes/farm/create/_b_id_farm/cultivations/_b_lu_catalogue/covercrop.tsx"),
                                    route("fertilizers", "./routes/farm/create/_b_id_farm/cultivations/_b_lu_catalogue/fertilizers.tsx"),
                                ])
                            ]),
                        ]),
                    ])
                ])
            ]),
        ])
    ]),

    // Authentication api
    route("api/auth/:", "./routes/api/auth.tsx"),

] satisfies RouteConfig;