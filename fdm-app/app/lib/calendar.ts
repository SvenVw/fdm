/**
 * @file This module provides utility functions for handling calendar-related logic,
 * particularly for managing timeframes based on URL parameters.
 *
 * @packageDocumentation
 */
import type { Timeframe } from "@svenvw/fdm-core"
import type { Params } from "react-router"

const yearStart = 2020
const yearEnd = new Date().getFullYear()

/**
 * Extracts the calendar year parameter from the route's URL params.
 *
 * @param params - The `params` object from a Remix loader or action.
 * @returns The calendar year as a string.
 */
export function getCalendar(params: Params): string {
    return params.calendar as string
}

/**
 * Generates a `Timeframe` object based on a calendar year from the URL params.
 *
 * If the `calendar` param is a valid year, it creates a timeframe spanning that entire year.
 * Otherwise, it defaults to a timeframe covering all supported years (from 2020 to the current year).
 *
 * @param params - The `params` object from a Remix loader or action.
 * @returns A `Timeframe` object with `start` and `end` Date objects.
 * @throws {Error} If the provided year is outside the supported range.
 */
export function getTimeframe(params: Params): Timeframe {
    const calendar = getCalendar(params)
    const defaultTimeframe = {
        start: new Date(`${yearStart}-01-01T00:00:00.000Z`),
        end: new Date(`${yearEnd}-12-31T23:59:59.999Z`),
    }

    if (calendar) {
        const year = Number(calendar)
        if (!Number.isNaN(year)) {
            if (year < yearStart || year > yearEnd) {
                throw new Error(`Unsupported year: ${calendar}`)
            }
            return {
                start: new Date(`${year}-01-01T00:00:00.000Z`),
                end: new Date(`${year}-12-31T23:59:59.999Z`),
            }
        }
    }

    return defaultTimeframe
}

/**
 * Generates a list of selectable years for UI components, from the current year down to 2020.
 *
 * @returns An array of strings, where each string is a year.
 */
export function getCalendarSelection(): string[] {
    const years = []
    for (let i = yearStart; i <= yearEnd; i++) {
        years.push(i.toString())
    }
    return years.reverse()
}
