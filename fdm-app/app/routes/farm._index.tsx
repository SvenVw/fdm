import { LoaderFunctionArgs, NavLink,  useLoaderData } from "react-router";

// Components
import { Separator } from "@/components/ui/separator";
import { SidebarInset} from "@/components/ui/sidebar";
import { Card, CardContent, CardDescription, CardFooter, CardHeader} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FarmHeader } from "@/components/custom/farm/farm-header";
import { FarmTitle } from "@/components/custom/farm/farm-title";

// Utils
import { auth } from "@/lib/auth.server";
import { getFarms } from "@svenvw/fdm-core";
import { fdm } from "@/lib/fdm.server";
import { getTimeBasedGreeting } from "@/lib/greetings";

export async function loader({
    request,
}: LoaderFunctionArgs) {
    try {
        // Get the session
        const session = await auth.api.getSession({
            headers: request.headers
        })
        
        if (!session?.user) {
            throw new Response("Unauthorized", { status: 401 });
        }

        // Get the active farm and redirect to it
        const b_id_farm = session?.user?.farm_active

        // Get a list of possible farms of the user
        const farms = await getFarms(fdm)
        if (!Array.isArray(farms)) {
            throw new Error("Invalid farms data received");
        }

        const farmOptions = farms.map(farm => {
            if (!farm?.b_id_farm || !farm?.b_name_farm) {
                throw new Error("Invalid farm data structure");
            }
            return {
                b_id_farm: farm.b_id_farm,
                b_name_farm: farm.b_name_farm
            }
        })

        // Return user information from loader
        return {
            b_id_farm: b_id_farm,
            farmOptions: farmOptions,
            user: session.user
        }
    } catch (error) {
        throw new Response(error instanceof Error ? error.message : "Internal Server Error", {
            status: error instanceof Response ? error.status : 500
        });
    }
}

export default function AppIndex() {
    const loaderData = useLoaderData<typeof loader>()
    const greeting = getTimeBasedGreeting();

    return (

        <SidebarInset>
            <FarmHeader
                farmOptions={loaderData.farmOptions}
                b_id_farm={loaderData.b_id_farm}
                action={undefined}
            />
            <main>
                {loaderData.farmOptions.length === 0 ? (
                    <>
                        <FarmTitle
                            title={`Welkom, ${loaderData.user.firstname}! 👋`}
                            description={""}
                        />
                        <div className="mx-auto flex h-full w-full items-center flex-col justify-center space-y-6 sm:w-[350px]">
                            <div className="flex flex-col space-y-2 text-center">
                                <h1 className="text-2xl font-semibold tracking-tight">
                                    Het lijkt erop dat je nog geen bedrijf hebt :(
                                </h1>
                                <p className="text-sm text-muted-foreground">
                                    Gebruik onze wizard en maak snel je eigen bedrijf aan
                                </p>
                            </div>
                            <Button asChild>
                                <NavLink to="./create">
                                    Maak een bedrijf
                                </NavLink>
                            </Button>
                            <p className="px-8 text-center text-sm text-muted-foreground">
                                De meeste gebruikers lukt het binnen 6 minuten.
                            </p>
                        </div>
                    </>
                ) : (
                    <>
                        <FarmTitle
                            title={`${greeting}, ${loaderData.user.firstname}! 👋`}
                            description={"Kies een bedrijf uit de lijst om verder te gaan of maak een nieuw bedrijf aan"}
                        />
                        <div className="flex h-full items-center justify-center">
                            <Card className="w-[350px]">
                                <CardHeader>
                                    {/* <CardTitle>Bedrijven</CardTitle> */}
                                    <CardDescription className="text-center">Kies een bedrijf om verder te gaan</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="grid w-full items-center gap-4">
                                        <div className="flex flex-col space-y-4">
                                            {loaderData.farmOptions.map((option) => (
                                                <div className="grid grid-cols-3 gap-x-3 items-center" key={option.b_id_farm}>
                                                    <div className="col-span-2">
                                                        <p className="text-sm font-medium leading-none">
                                                            {option.b_name_farm}
                                                        </p>
                                                        {/* <p className="text-sm text-muted-foreground">m@example.com</p> */}
                                                    </div>

                                                    <div className="">
                                                        <Button
                                                            asChild
                                                            aria-label={`Selecteer ${option.b_name_farm}`}
                                                        >
                                                            <NavLink to={`/farm/${option.b_id_farm}`}>
                                                                Selecteer
                                                            </NavLink>
                                                        </Button>
                                                    </div>

                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </CardContent>
                                <CardFooter className="flex flex-col items-center space-y-2">
                                    <Separator />
                                    <p className="text-muted-foreground text-sm">
                                        Of maak een nieuw bedrijf aan:
                                    </p>
                                    <NavLink to="/farm/create">
                                        <Button className="w-full">
                                            Nieuw bedrijf
                                        </Button>
                                    </NavLink>
                                </CardFooter>
                            </Card>
                        </div>
                    </>
                )}
            </main>
        </SidebarInset>

    )
}