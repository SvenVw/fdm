import { create } from "zustand"

interface CalendarState {
    calendar: string | undefined
    setCalendar: (calendar: string | undefined) => void
}

export const useCalendarStore = create<CalendarState>((set) => ({
    calendar: "all", // Initial calendar is 'all'
    setCalendar: (calendar) => set({ calendar: calendar ? calendar : "all" }),
}))
