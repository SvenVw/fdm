import { customType } from "drizzle-orm/pg-core"

// Workaround for that `numeric` column type returns string instead of a number
// https://github.com/drizzle-team/drizzle-orm/issues/1042#issuecomment-2224689025
type NumericConfig = {
    precision?: number
    scale?: number
}

export const numericCasted = customType<{
    data: number
    driverData: string
    config: NumericConfig
}>({
    dataType: (config) => {
        if (config?.precision && config?.scale) {
            return `numeric(${config.precision}, ${config.scale})`
        }
        return "numeric"
    },
    fromDriver: (value: string) => Number.parseFloat(value),
    toDriver: (value: number) => value.toString(),
})

// Workaround for geometry column with polygons
export const geometryPolygon = customType<{
    data: string // GeoJSON string
}>({
    dataType() {
        return "geometry(Polygon, 4326)"
    },
})

// Workaround for geometry column with multipoint
export const multiPoint = customType<{
    data: string // GeoJSON string
}>({
    dataType() {
        return "geometry(MultiPoint, 4326)"
    },
})
