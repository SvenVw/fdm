/**
 * @file This file defines a reusable `LoadingSpinner` component.
 *
 * This component renders a simple, animated SVG spinner to indicate a loading state.
 *
 * @packageDocumentation
 */
import { cn } from "~/lib/utils"

/**
 * Props for the SVG-based components.
 */
export interface ISVGProps extends React.SVGProps<SVGSVGElement> {
    /** The size (width and height) of the SVG icon. Defaults to 24. */
    size?: number
    /** Additional CSS classes to apply to the SVG element. */
    className?: string
}

/**
 * A reusable loading spinner component.
 *
 * This component displays a simple animated SVG spinner that can be used to indicate
 * loading or processing states anywhere in the application. Its size and styling
 * can be customized via props.
 *
 * @param props - The props for the component, including standard SVG attributes, `size`, and `className`.
 * @returns A spinning SVG element.
 */
export const LoadingSpinner = ({
    size = 24,
    className,
    ...props
}: ISVGProps) => {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width={size}
            height={size}
            {...props}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={cn("animate-spin", className)}
        >
            <path d="M21 12a9 9 0 1 1-6.219-8.56" />
        </svg>
    )
}
