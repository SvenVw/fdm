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
import { handleLoaderError } from "@/lib/error"
import { fdm } from "@/lib/fdm.server"
import { getTimeBasedGreeting } from "@/lib/greetings"
import { getFarms, getFields } from "@svenvw/fdm-core"
import {
    type LoaderFunctionArgs,
    NavLink,
    data,
    redirect,
    useLoaderData,
} from "react-router"

/**
 * Retrieves and processes farm and field options for the specified farm ID based on the current user session.
 *
 * This loader function extracts the active farm ID from the route parameters and uses the user’s session to:
 * - Fetch all farms associated with the user, redirecting to the farms overview if none exist.
 * - Validate and map the farms into selectable options.
 * - Retrieve and validate the fields for the active farm, rounding each field's area and sorting the fields alphabetically.
 *
 * @throws {Response} When the required farm ID is missing from the route parameters.
 * @throws {Error} When a farm or field lacks the necessary data structure.
 *
 * @returns An object containing:
 * - b_id_farm: The active farm ID.
 * - farmOptions: An array of validated farm options.
 * - fieldOptions: A sorted array of processed field options.
 * - userName: The name of the current user.
 */
export async function loader({ request, params }: LoaderFunctionArgs) {
    try {
        // Get the active farm
        const b_id_farm = params.b_id_farm
        if (!b_id_farm) {
            throw data("missing: b_id_farm", {
                status: 400,
                statusText: "missing: b_id_farm",
            })
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
            userName: session.userName,
        }
    } catch (error) {
        throw handleLoaderError(error)
    }
}

/**
 * Renders a user interface for selecting or creating a field within a farm.
 *
 * This component retrieves loader data to access the available farm options, field options, and user information.
 * Depending on whether fields exist, it either displays:
 * - A welcome screen prompting the user to create a new field if no fields are present.
 * - A list of existing fields with selection controls and a time-based greeting for navigation.
 *
 * @example
 * <FarmFieldIndex />
 */
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
                                    Het aanmaken van een perceel is binnenkort
                                    beschikbaar.
                                </p>
                            </div>
                            <div className="flex flex-col items-center relative">
                                <Button disabled>
                                    Maak een perceel
                                    <br />
                                    (nog niet beschikbaar)
                                </Button>
                            </div>
                            {/* <p className="px-8 text-center text-sm text-muted-foreground">
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
                                <CardFooter className="flex flex-col items-center space-y-2 relative">
                                    <Separator />
                                    <p className="text-muted-foreground text-sm">
                                        Of maak een nieuw perceel aan:
                                    </p>
                                    <div className="flex flex-col items-center w-full">
                                        <Button disabled>
                                            Maak een perceel
                                            <br />
                                            (nog niet beschikbaar)
                                        </Button>
                                    </div>
                                </CardFooter>
                            </Card>
                        </div>
                    </>
                )}
            </main>
        </SidebarInset>
    )
}
