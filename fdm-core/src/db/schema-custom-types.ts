import { sql } from 'drizzle-orm';
import { customType } from 'drizzle-orm/pg-core';
import wkx from 'wkx'

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
		return 'numeric'
	},
	fromDriver: (value: string) => Number.parseFloat(value), 
	toDriver: (value: number) => value.toString(),
})

// Workaround for geometry column with polygons
export const geometryPolygon = customType<{
	data: string
	driverData: string
}>({
	dataType: () => {
		return `geometry(polygon)`
	},
	fromDriver: (value: string) => {
		const wkbBuffer = Buffer.from(value, 'hex')
		const geometry = wkx.Geometry.parse(wkbBuffer)
		return geometry.toWkt()
	}, 
	toDriver: (value: string) => sql`ST_GeomFromText('${value}', 4326)`
})

// Workaround for geometry column with multipoint
export const geometryMultipoint = customType<{
	data: string
	driverData: string
}>({
	dataType: () => {
		return `geometry(point)`
	},
	fromDriver: (value: string) => {
		const wkbBuffer = Buffer.from(value, 'hex')
		const geometry = wkx.Geometry.parse(wkbBuffer)
		return geometry.toWkt()
	}, 
	toDriver: (value: string) => sql`ST_GeomFromText('${value}', 4326)`
})