import {
    type LoaderFunctionArgs,
    NavLink,
    data,
    redirect,
    useLoaderData,
} from "react-router"
import { FarmHeader } from "@/components/custom/farm/farm-header"
import { FarmTitle } from "@/components/custom/farm/farm-title"
import { Button } from "@/components/ui/button"
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
} from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { SidebarInset } from "@/components/ui/sidebar"
import { getSession } from "@/lib/auth.server"
import { fdm } from "@/lib/fdm.server"
import { getTimeBasedGreeting } from "@/lib/greetings"
import { getFarms, getFields } from "@svenvw/fdm-core"
import { handleLoaderError } from "@/lib/error"

export async function loader({ request, params }: LoaderFunctionArgs) {
    try {
        // Get the active farm
        const b_id_farm = params.b_id_farm
        if (!b_id_farm) {
            throw new Response("Farm ID is required", { status: 400 })
        }

        // Get the session
        const session = await getSession(request)

        // Get a list of possible farms of the user
        const farms = await getFarms(fdm, session.principal_id)

        // Redirect to farms overview if user has no farm
        if (farms.length === 0) {
            return redirect("./farm")
        }

        // Get farms to be selected
        const farmOptions = farms.map((farm) => {
            if (!farm?.b_id_farm || !farm?.b_name_farm) {
                throw new Error("Invalid farm data structure")
            }
            return {
                b_id_farm: farm.b_id_farm,
                b_name_farm: farm.b_name_farm,
            }
        })

        // Get the fields to be selected
        const fields = await getFields(fdm, session.principal_id, b_id_farm)
        const fieldOptions = fields.map((field) => {
            if (!field?.b_id || !field?.b_name) {
                throw new Error("Invalid field data structure")
            }
            return {
                b_id: field.b_id,
                b_name: field.b_name,
                b_area: Math.round(field.b_area * 10) / 10,
            }
        })

        // Sort fields by name alphabetically
        fieldOptions.sort((a, b) => a.b_name.localeCompare(b.b_name))

        // Return user information from loader
        return {
            b_id_farm: b_id_farm,
            farmOptions: farmOptions,
            fieldOptions: fieldOptions,
            userName: session.userName
        }
    } catch (error) {
        throw handleLoaderError(error)
    }
}

export default function FarmFieldIndex() {
    const loaderData = useLoaderData<typeof loader>()
    const greeting = getTimeBasedGreeting()

    return (
        <SidebarInset>
            <FarmHeader
                farmOptions={loaderData.farmOptions}
                b_id_farm={loaderData.b_id_farm}
                fieldOptions={loaderData.fieldOptions}
                b_id={undefined}
                action={{
                    to: `/farm/${loaderData.b_id_farm}`,
                    label: "Terug naar bedrijf",
                }}
            />
            <main>
                {loaderData.fieldOptions.length === 0 ? (
                    <>
                        <FarmTitle
                            title={`Welkom, ${loaderData.userName}! 👋`}
                            description={""}
                        />
                        <div className="mx-auto flex h-full w-full items-center flex-col justify-center space-y-6 sm:w-[350px]">
                            <div className="flex flex-col space-y-2 text-center">
                                <h1 className="text-2xl font-semibold tracking-tight">
                                    Het lijkt erop dat je nog geen perceel hebt
                                    :(
                                </h1>
                                <p className="text-sm text-muted-foreground">
                                    Maak een perceel aan
                                </p>
                            </div>
                            <Button asChild>
                                <NavLink
                                    to={`./farm/${loaderData.b_id_farm}/field/create`}
                                >
                                    Maak een perceel
                                </NavLink>
                            </Button>
                            {/* <p className="px-8 text-center text-sm text-muted-foreground">
                                De meeste gebruikers lukt het binnen 6 minuten.
                            </p> */}
                        </div>
                    </>
                ) : (
                    <>
                        <FarmTitle
                            title={`${greeting}, ${loaderData.userName}! 👋`}
                            description={
                                "Kies een perceel uit de lijst om verder te gaan of maak een nieuw perceel aan"
                            }
                        />
                        <div className="flex h-full items-center justify-center">
                            <Card className="w-[350px]">
                                <CardHeader>
                                    {/* <CardTitle>Bedrijven</CardTitle> */}
                                    <CardDescription className="text-center">
                                        Kies een perceel om verder te gaan
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="grid w-full items-center gap-4">
                                        <div className="flex flex-col space-y-4">
                                            {loaderData.fieldOptions.map(
                                                (option) => (
                                                    <div
                                                        className="grid grid-cols-3 gap-x-3 items-center"
                                                        key={option.b_id}
                                                    >
                                                        <div className="col-span-2">
                                                            <p className="text-sm font-medium leading-none">
                                                                {option.b_name}
                                                            </p>
                                                            {option.b_area &&
                                                            option.b_area >
                                                                0.1 ? (
                                                                <p className="text-sm text-muted-foreground">
                                                                    {
                                                                        option.b_area
                                                                    }{" "}
                                                                    ha
                                                                </p>
                                                            ) : null}
                                                        </div>

                                                        <div className="">
                                                            <Button
                                                                asChild
                                                                aria-label={`Selecteer ${option.b_name}`}
                                                            >
                                                                <NavLink
                                                                    to={`./${option.b_id}`}
                                                                >
                                                                    Selecteer
                                                                </NavLink>
                                                            </Button>
                                                        </div>
                                                    </div>
                                                ),
                                            )}
                                        </div>
                                    </div>
                                </CardContent>
                                <CardFooter className="flex flex-col items-center space-y-2">
                                    <Separator />
                                    <p className="text-muted-foreground text-sm">
                                        Of maak een nieuw perceel aan:
                                    </p>
                                    <NavLink to={"./create"}>
                                        <Button className="w-full">
                                            Nieuw perceel
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
