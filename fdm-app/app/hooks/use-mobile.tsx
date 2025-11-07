/**
 * @file This file defines a custom React hook, `useIsMobile`, for detecting
 * whether the application is being viewed on a mobile-sized screen.
 *
 * @packageDocumentation
 */
import * as React from "react"

/**
 * The pixel width breakpoint for determining a mobile screen.
 * Screens with a width less than this value are considered mobile.
 */
const MOBILE_BREAKPOINT = 768

/**
 * A custom React hook that determines if the current viewport is a mobile device.
 *
 * This hook uses the `window.matchMedia` API to check if the screen width is
 * below a predefined `MOBILE_BREAKPOINT`. It returns `true` for mobile viewports
 * and `false` otherwise. The hook also listens for changes in viewport size and
 * updates its state accordingly.
 *
 * During server-side rendering, or if `window.matchMedia` is unavailable, it
 * defaults to `false`.
 *
 * @returns A boolean value: `true` if the viewport is mobile-sized, otherwise `false`.
 */
export function useIsMobile() {
    const [isMobile, setIsMobile] = React.useState<boolean | undefined>(
        undefined,
    )

    React.useEffect(() => {
        if (typeof window === "undefined" || !window.matchMedia) {
            setIsMobile(false)
            return
        }
        const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
        const onChange = (e: MediaQueryListEvent) => {
            setIsMobile(e.matches)
        }
        mql.addEventListener("change", onChange)
        setIsMobile(mql.matches)
        return () => mql.removeEventListener("change", onChange)
    }, [])

    return !!isMobile
}
