import { Button } from "@/components/ui/button";
import { NavLink } from "react-router";

export default function MissingFarm() {

    return (
        <>
            <div className="mx-auto flex h-screen w-full items-center flex-col justify-center space-y-6 sm:w-[350px]">
                <div className="flex flex-col space-y-2 text-center">
                    <h1 className="text-2xl font-semibold tracking-tight">
                        Het lijkt erop dat je nog geen bedrijf hebt :(
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        Gebruik onze wizard en maak snel je eigen bedrijf aan
                    </p>
                </div>
                <Button>
                    <NavLink to="./farm/create/new">
                        Maak een bedrijf
                    </NavLink>
                </Button>
                <p className="px-8 text-center text-sm text-muted-foreground">
                    De meeste gebruikers lukt het binnen 6 minuten.
                </p>
            </div>
        </>
    )
}
