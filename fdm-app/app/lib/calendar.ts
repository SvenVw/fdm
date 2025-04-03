import type { Timeframe } from "@svenvw/fdm-core"
import type { Params } from "react-router"

export function getCalendar(params: Params): string {
    const calendar = params.calendar as string | "all"

    return calendar
}

export function getTimeframe(params: Params): Timeframe {
    const calendar = getCalendar(params)

    const timeframe = {
        start: new Date("1970-01-01T00:00:00.000Z"),
        end: new Date("2099-12-31T00:00:00.000Z"),
    }

    // Check if calendar is year and create a timeframe
    if (calendar) {
        // Try to coerce to year
        const year = Number(calendar)
        if (!Number.isNaN(year)) {
            // Check if year is supported
            if (year < 1970 || year > 2099) {
                throw new Error(`Unsupported year: ${calendar}`)
            }
            // Set start and end date
            timeframe.start = new Date(`${year}-01-01T00:00:00.000Z`)
            timeframe.end = new Date(`${year}-12-31T23:59:59.999Z`)
        }
    }

    return timeframe
}

export function getCalendarSelection(): string[] {
    // Get current year
    const currentYear = new Date().getFullYear()

    // Create array of years from 2020 to current year
    const years = []
    for (let i = 2020; i <= currentYear; i++) {
        years.push(i.toString())
    }
    years.push("all")

    // Reverse the array
    years.reverse()

    return years
}
