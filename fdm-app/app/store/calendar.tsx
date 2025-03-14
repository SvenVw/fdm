import { create } from "zustand"
import { persist, createJSONStorage } from "zustand/middleware"
import type { Timeframe } from "@svenvw/fdm-core"

interface Season {
    title: string
    key: string
    startDate: Date | null
    endDate: Date | null
}

interface CalendarState {
    selectedSeasonKey: string
    selectedSeason: Season | null
    setSelectedSeason: (season: Season) => void
    seasons: Season[]
    getTimeframe: () => Timeframe
}

const initialSeasons: Season[] = [
    {
        title: "Alle jaren",
        key: "all",
        startDate: null,
        endDate: null,
    },
    {
        title: "2025",
        key: "2025",
        startDate: new Date("2025-01-01"),
        endDate: new Date("2025-12-31"),
    },
    {
        title: "2024",
        key: "2024",
        startDate: new Date("2024-01-01"),
        endDate: new Date("2024-12-31"),
    },
]

export const useCalendarStore = create<CalendarState>()(
    persist(
        (set, get) => ({
            selectedSeasonKey: "all",
            selectedSeason:
                initialSeasons.find((season) => season.key === "all") || null,
            setSelectedSeason: (season) =>
                set({ selectedSeason: season, selectedSeasonKey: season.key }),
            seasons: initialSeasons,
            getTimeframe: () => {
                const selectedSeason = get().selectedSeason
                return {
                    start: selectedSeason?.startDate || null,
                    end: selectedSeason?.endDate || null,
                }
            },
        }),
        {
            name: "calendar-storage", // unique name
            storage: createJSONStorage(() => localStorage), // (optional) by default, 'localStorage' is used
        },
    ),
)
