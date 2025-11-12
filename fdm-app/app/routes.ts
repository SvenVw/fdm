/**
 * @file This file configures the application's routing using file-system based routing.
 *
 * It uses the `flatRoutes` utility from `@react-router/fs-routes` to automatically
 * generate the route configuration based on the file and folder structure within the
 * `app/routes` directory. This approach simplifies route management by co-locating route
 * modules with their corresponding UI components.
 *
 * @see https://reactrouter.com/en/main/guides/file-based-routing
 * @packageDocumentation
 */
import type { RouteConfig } from "@react-router/dev/routes"
import { flatRoutes } from "@react-router/fs-routes"

/**
 * Exports the auto-generated route configuration for the application.
 */
export default flatRoutes() satisfies RouteConfig
