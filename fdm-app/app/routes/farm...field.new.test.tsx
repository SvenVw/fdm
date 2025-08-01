// Note: The rest of the file remains unchanged. Only the two mocked components below have been updated.

vi.mock("react-map-gl/mapbox", () => ({
    Map: ({ children, onClick, ...props }: any) => (
        <button
            data-testid="mapbox-map"
            onClick={onClick}
            onKeyUp={onClick}
            {...props}
        >
            {children}
        </button>
    ),
    GeolocateControl: () => <div data-testid="geolocate-control" />,
    NavigationControl: () => <div data-testid="navigation-control" />,
    Layer: (props: any) => <div data-testid="map-layer" {...props} />,
}))

vi.mock("~/components/blocks/field/form", () => ({
    default: ({ open, setOpen, field, cultivationOptions, fieldNameDefault }: any) => (
        <div
            data-testid="field-details-dialog"
            data-open={open}
            data-field-name={fieldNameDefault}
        >
            <button type="button" onClick={() => setOpen(false)}>Close</button>
        </div>
    ),
}))

// ... all other imports, mocks, tests, and code in the file remain exactly as in the original.