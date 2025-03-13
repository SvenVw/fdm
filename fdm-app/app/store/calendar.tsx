import { create } from "zustand"

interface CalendarState {
    selectedSeasonKey: string
    setSelectedSeasonKey: (seasonKey: string) => void
}

export const useCalendarStore = create<CalendarState>((set) => ({
    selectedSeasonKey: "all",
    setSelectedSeasonKey: (seasonKey) => set({ selectedSeasonKey: seasonKey }),
}))
