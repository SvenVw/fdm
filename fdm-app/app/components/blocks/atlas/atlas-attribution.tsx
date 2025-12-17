import { clientConfig } from "~/lib/config"

export function MapTilerAttribution() {
    if (clientConfig.integrations.map.provider !== "maptiler") {
        return null
    }

    return (
        <a
            href="https://www.maptiler.com"
            style={{ position: "absolute", left: 10, bottom: 10, zIndex: 999 }}
        >
            <img
                src="https://api.maptiler.com/resources/logo.svg"
                alt="MapTiler logo"
            />
        </a>
    )
}
