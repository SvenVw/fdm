import { FarmHeader } from "@/components/custom/farm/farm-header"
import { FarmTitle } from "@/components/custom/farm/farm-title"
import { FormSchema } from "@/components/custom/fertilizer/formschema"
import { LoadingSpinner } from "@/components/custom/loadingspinner"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import {
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { SidebarInset } from "@/components/ui/sidebar"
import { getSession } from "@/lib/auth.server"
import { handleLoaderError } from "@/lib/error"
import { fdm } from "@/lib/fdm.server"
import { zodResolver } from "@hookform/resolvers/zod"
import { getFarm, getFarms, getFertilizer } from "@svenvw/fdm-core"
import { useEffect } from "react"
import {
    Form,
    type LoaderFunctionArgs,
    data,
    useLoaderData,
} from "react-router"
import { RemixFormProvider, useRemixForm } from "remix-hook-form"
import type { z } from "zod"

export async function loader({ request, params }: LoaderFunctionArgs) {
    try {
        // Get the farm id
        const b_id_farm = params.b_id_farm
        if (!b_id_farm) {
            throw data("invalid: b_id_farm", {
                status: 400,
                statusText: "invalid: b_id_farm",
            })
        }

        // Get the fertilizer id
        const p_id = params.p_id
        if (!p_id) {
            throw data("invalid: p_id", {
                status: 400,
                statusText: "invalid: p_id",
            })
        }

        // Get the session
        const session = await getSession(request)

        // Get details of farm
        const farm = await getFarm(fdm, session.principal_id, b_id_farm)
        if (!farm) {
            throw data("not found: b_id_farm", {
                status: 404,
                statusText: "not found: b_id_farm",
            })
        }

        // Get a list of possible farms of the user
        const farms = await getFarms(fdm, session.principal_id)
        if (!farms || farms.length === 0) {
            throw data("not found: farms", {
                status: 404,
                statusText: "not found: farms",
            })
        }

        const farmOptions = farms.map((farm) => {
            return {
                b_id_farm: farm.b_id_farm,
                b_name_farm: farm.b_name_farm,
            }
        })

        // Get the available fertilizers
        const fertilizer = await getFertilizer(fdm, p_id)

        // Set editable status
        let editable = true
        console.log(fertilizer.p_source)
        if (fertilizer.p_source === b_id_farm) {
            editable = true
        }

        // Return user information from loader
        return {
            farm: farm,
            b_id_farm: b_id_farm,
            farmOptions: farmOptions,
            fertilizer: fertilizer,
            editable: editable,
        }
    } catch (error) {
        throw handleLoaderError(error)
    }
}

/**
 * Renders the layout for managing farm settings.
 *
 * This component displays a sidebar that includes the farm header, navigation options, and a link to farm fields.
 * It also renders a main section containing the farm title, description, nested routes via an Outlet, and a notification toaster.
 */
export default function FarmFertilizerBlock() {
    const loaderData = useLoaderData<typeof loader>()
    const fertilizer = loaderData.fertilizer

    fertilizer.p_type = ""
    if (fertilizer.p_type_manure) {
        fertilizer.p_type = "manure"
    } else if (fertilizer.p_type_compost) {
        fertilizer.p_type = "compost"
    } else if (fertilizer.p_type_mineral) {
        fertilizer.p_type = "mineral"
    }

    const form = useRemixForm<z.infer<typeof FormSchema>>({
        mode: "onTouched",
        resolver: zodResolver(FormSchema),
        defaultValues: {
            p_name_nl: fertilizer.p_name_nl,
            p_type: fertilizer.p_type,
            p_n_rt: fertilizer.p_n_rt,
            p_n_wc: fertilizer.p_n_wc,
            p_p_rt: fertilizer.p_p_rt,
            p_k_rt: fertilizer.p_k_rt,
            p_om: fertilizer.p_om,
            p_eoc: fertilizer.p_eoc,
            p_s_rt: fertilizer.p_s_rt,
            p_ca_rt: fertilizer.p_ca_rt,
            p_mg_rt: fertilizer.p_mg_rt,
        },
    })

    useEffect(() => {
        form.reset({
            p_name_nl: fertilizer.p_name_nl,
            p_type: fertilizer.p_type,
            p_n_rt: fertilizer.p_n_rt,
            p_n_wc: fertilizer.p_n_wc,
            p_p_rt: fertilizer.p_p_rt,
            p_k_rt: fertilizer.p_k_rt,
            p_om: fertilizer.p_om,
            p_eoc: fertilizer.p_eoc,
            p_s_rt: fertilizer.p_s_rt,
            p_ca_rt: fertilizer.p_ca_rt,
            p_mg_rt: fertilizer.p_mg_rt,
        })
    }, [fertilizer, form.reset])

    return (
        <SidebarInset>
            <FarmHeader
                farmOptions={loaderData.farmOptions}
                b_id_farm={loaderData.b_id_farm}
                action={{
                    to: "../fertilizers",
                    label: "Terug naar overzicht",
                }}
            />
            <main>
                <FarmTitle
                    title={loaderData.fertilizer.p_name_nl}
                    description={"Bekijk de eigenschappen van dit product"}
                />
                <div className="space-y-6 p-10 pb-0">
                    <RemixFormProvider {...form}>
                        <Form
                            id="formField"
                            onSubmit={form.handleSubmit}
                            method="post"
                        >
                            <fieldset disabled={form.formState.isSubmitting}>
                                <div className="flex flex-col space-y-8 lg:flex-row lg:space-x-12 lg:space-y-0">
                                    <Card className="w-full">
                                        <CardHeader>
                                            <CardTitle>
                                                Algemene informatie
                                            </CardTitle>
                                            <CardDescription>
                                                Details over de meststof
                                            </CardDescription>
                                        </CardHeader>
                                        <CardContent className="grid grid-cols-1 gap-4">
                                            <div className="flex items-center justify-between gap-2">
                                                <span className="font-medium">
                                                    Naam
                                                </span>
                                                <div className="flex items-center gap-2">
                                                    {loaderData.editable ? (
                                                        <FormField
                                                            control={
                                                                form.control
                                                            }
                                                            name="p_name_nl"
                                                            render={({
                                                                field,
                                                            }) => (
                                                                <FormItem className="flex items-center gap-2">
                                                                    <FormControl>
                                                                        <Input
                                                                            {...field}
                                                                            className="w-full text-right"
                                                                        />
                                                                    </FormControl>
                                                                    <FormDescription />
                                                                    <FormMessage />
                                                                </FormItem>
                                                            )}
                                                        />
                                                    ) : (
                                                        <span>
                                                            {
                                                                fertilizer.p_name_nl
                                                            }
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="flex items-center justify-between gap-2">
                                                <span className="font-medium">
                                                    Catalogus
                                                </span>
                                                <span className="flex items-center gap-2">
                                                    {fertilizer.p_source !==
                                                    loaderData.b_id_farm ? (
                                                        <Badge variant="default">
                                                            {
                                                                loaderData.farm
                                                                    .b_name_farm
                                                            }
                                                        </Badge>
                                                    ) : (
                                                        <Badge variant="default">
                                                            {
                                                                fertilizer.p_source
                                                            }
                                                        </Badge>
                                                    )}
                                                </span>
                                            </div>
                                            <div className="flex items-center justify-between gap-2">
                                                <span className="font-medium">
                                                    Type
                                                </span>
                                                {loaderData.editable ? (
                                                    <FormField
                                                        control={form.control}
                                                        name="p_type"
                                                        render={({ field }) => (
                                                            <FormItem className="flex items-center gap-2">
                                                                <Select
                                                                    onValueChange={
                                                                        field.onChange
                                                                    } // Use onValueChange
                                                                    defaultValue={
                                                                        field.value
                                                                    } // use defaultValue
                                                                    onBlur={
                                                                        field.onBlur
                                                                    }
                                                                    name={
                                                                        field.name
                                                                    }
                                                                    disabled={
                                                                        false
                                                                    } // add disabled (optional)
                                                                    className="w-full text-right"
                                                                >
                                                                    <SelectTrigger>
                                                                        <SelectValue placeholder="Kies het type" />
                                                                    </SelectTrigger>

                                                                    <SelectContent>
                                                                        <SelectItem value="mineral">
                                                                            Kunstmest
                                                                        </SelectItem>
                                                                        <SelectItem value="manure">
                                                                            Mest
                                                                        </SelectItem>
                                                                        <SelectItem value="compost">
                                                                            Compost
                                                                        </SelectItem>
                                                                    </SelectContent>
                                                                </Select>
                                                                <FormDescription />
                                                                <FormMessage />
                                                            </FormItem>
                                                        )}
                                                    />
                                                ) : (
                                                    <span className="flex items-center gap-2">
                                                        {fertilizer.p_type_manure ? (
                                                            <Badge variant="default">
                                                                Mest
                                                            </Badge>
                                                        ) : null}
                                                        {fertilizer.p_type_compost ? (
                                                            <Badge variant="default">
                                                                Compost
                                                            </Badge>
                                                        ) : null}
                                                        {fertilizer.p_type_mineral ? (
                                                            <Badge variant="default">
                                                                Kunstmest
                                                            </Badge>
                                                        ) : null}
                                                    </span>
                                                )}
                                            </div>
                                        </CardContent>
                                        {loaderData.editable && (
                                            <CardFooter className="w-full">
                                                <Button
                                                    type="submit"
                                                    disabled={
                                                        form.formState
                                                            .isSubmitting
                                                    }
                                                >
                                                    {form.formState
                                                        .isSubmitting && (
                                                        <LoadingSpinner />
                                                    )}
                                                    Opslaan
                                                </Button>
                                            </CardFooter>
                                        )}
                                    </Card>
                                    <Card className="w-full">
                                        <CardHeader>
                                            <CardTitle>Samenstelling</CardTitle>
                                            <CardDescription>
                                                De gehalten van deze meststof
                                            </CardDescription>
                                        </CardHeader>
                                        <CardContent className="grid grid-cols-1 gap-4">
                                            <div className="grid grid-cols-[2fr_1fr_auto] gap-4 items-center">
                                                {/* Stikstof Row */}
                                                <div className="font-medium">
                                                    Stikstof
                                                </div>
                                                <div className="flex items-center justify-end">
                                                    {loaderData.editable ? (
                                                        <FormField
                                                            control={
                                                                form.control
                                                            }
                                                            name="p_n_rt"
                                                            render={({
                                                                field,
                                                            }) => (
                                                                <FormItem className="flex items-center">
                                                                    <FormControl>
                                                                        <Input
                                                                            {...field}
                                                                            className="w-24 text-right"
                                                                        />
                                                                    </FormControl>
                                                                    <FormDescription />
                                                                    <FormMessage />
                                                                </FormItem>
                                                            )}
                                                        />
                                                    ) : (
                                                        <span>
                                                            {fertilizer.p_n_rt}
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="font-medium text-muted-foreground">
                                                    g N / kg
                                                </div>

                                                {/* Stikstof, werkingscoëfficiënt Row */}
                                                <div className="font-medium">
                                                    Stikstof,
                                                    werkingscoëfficiënt
                                                </div>
                                                <div className="flex items-center justify-end">
                                                    {loaderData.editable ? (
                                                        <FormField
                                                            control={
                                                                form.control
                                                            }
                                                            name="p_n_wc"
                                                            render={({
                                                                field,
                                                            }) => (
                                                                <FormItem className="flex items-center">
                                                                    <FormControl>
                                                                        <Input
                                                                            {...field}
                                                                            className="w-24 text-right"
                                                                        />
                                                                    </FormControl>
                                                                    <FormDescription />
                                                                    <FormMessage />
                                                                </FormItem>
                                                            )}
                                                        />
                                                    ) : (
                                                        <span>
                                                            {fertilizer.p_n_wc}
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="font-medium text-muted-foreground">
                                                    -
                                                </div>
                                                {/* Fosfaat Row */}
                                                <div className="font-medium">
                                                    Fosfaat
                                                </div>
                                                <div className="flex items-center justify-end">
                                                    {loaderData.editable ? (
                                                        <FormField
                                                            control={
                                                                form.control
                                                            }
                                                            name="p_p_rt"
                                                            render={({
                                                                field,
                                                            }) => (
                                                                <FormItem className="flex items-center">
                                                                    <FormControl>
                                                                        <Input
                                                                            {...field}
                                                                            className="w-24 text-right"
                                                                        />
                                                                    </FormControl>
                                                                    <FormDescription />
                                                                    <FormMessage />
                                                                </FormItem>
                                                            )}
                                                        />
                                                    ) : (
                                                        <span>
                                                            {fertilizer.p_p_rt}
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="font-medium text-muted-foreground">
                                                    g P2O5 / kg
                                                </div>

                                                {/* Kalium Row */}
                                                <div className="font-medium">
                                                    Kalium
                                                </div>
                                                <div className="flex items-center justify-end">
                                                    {loaderData.editable ? (
                                                        <FormField
                                                            control={
                                                                form.control
                                                            }
                                                            name="p_k_rt"
                                                            render={({
                                                                field,
                                                            }) => (
                                                                <FormItem className="flex items-center">
                                                                    <FormControl>
                                                                        <Input
                                                                            {...field}
                                                                            className="w-24 text-right"
                                                                        />
                                                                    </FormControl>
                                                                    <FormDescription />
                                                                    <FormMessage />
                                                                </FormItem>
                                                            )}
                                                        />
                                                    ) : (
                                                        <span>
                                                            {fertilizer.p_k_rt}
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="font-medium text-muted-foreground">
                                                    g K2O / kg
                                                </div>

                                                {/* Organische stof Row */}
                                                <div className="font-medium">
                                                    Organische stof
                                                </div>
                                                <div className="flex items-center justify-end">
                                                    {loaderData.editable ? (
                                                        <FormField
                                                            control={
                                                                form.control
                                                            }
                                                            name="p_om"
                                                            render={({
                                                                field,
                                                            }) => (
                                                                <FormItem className="flex items-center">
                                                                    <FormControl>
                                                                        <Input
                                                                            {...field}
                                                                            className="w-24 text-right"
                                                                        />
                                                                    </FormControl>
                                                                    <FormDescription />
                                                                    <FormMessage />
                                                                </FormItem>
                                                            )}
                                                        />
                                                    ) : (
                                                        <span>
                                                            {fertilizer.p_om}
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="font-medium text-muted-foreground">
                                                    g OS / kg
                                                </div>

                                                {/* Koolstof, effectief Row */}
                                                <div className="font-medium">
                                                    Koolstof, effectief
                                                </div>
                                                <div className="flex items-center justify-end">
                                                    {loaderData.editable ? (
                                                        <FormField
                                                            control={
                                                                form.control
                                                            }
                                                            name="p_eoc"
                                                            render={({
                                                                field,
                                                            }) => (
                                                                <FormItem className="flex items-center">
                                                                    <FormControl>
                                                                        <Input
                                                                            {...field}
                                                                            className="w-24 text-right"
                                                                        />
                                                                    </FormControl>
                                                                    <FormDescription />
                                                                    <FormMessage />
                                                                </FormItem>
                                                            )}
                                                        />
                                                    ) : (
                                                        <span>
                                                            {fertilizer.p_eoc}
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="font-medium text-muted-foreground">
                                                    g EOC / kg
                                                </div>

                                                {/* Zwavel Row */}
                                                <div className="font-medium">
                                                    Zwavel
                                                </div>
                                                <div className="flex items-center justify-end">
                                                    {loaderData.editable ? (
                                                        <FormField
                                                            control={
                                                                form.control
                                                            }
                                                            name="p_s_rt"
                                                            render={({
                                                                field,
                                                            }) => (
                                                                <FormItem className="flex items-center">
                                                                    <FormControl>
                                                                        <Input
                                                                            {...field}
                                                                            className="w-24 text-right"
                                                                        />
                                                                    </FormControl>
                                                                    <FormDescription />
                                                                    <FormMessage />
                                                                </FormItem>
                                                            )}
                                                        />
                                                    ) : (
                                                        <span>
                                                            {fertilizer.p_s_rt}
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="font-medium text-muted-foreground">
                                                    g SO3 / kg
                                                </div>

                                                {/* Calcium (Ca) Row */}
                                                <div className="font-medium">
                                                    Calcium
                                                </div>
                                                <div className="flex items-center justify-end">
                                                    {loaderData.editable ? (
                                                        <FormField
                                                            control={
                                                                form.control
                                                            }
                                                            name="p_ca_rt"
                                                            render={({
                                                                field,
                                                            }) => (
                                                                <FormItem className="flex items-center">
                                                                    <FormControl>
                                                                        <Input
                                                                            {...field}
                                                                            className="w-24 text-right"
                                                                        />
                                                                    </FormControl>
                                                                    <FormDescription />
                                                                    <FormMessage />
                                                                </FormItem>
                                                            )}
                                                        />
                                                    ) : (
                                                        <span>
                                                            {fertilizer.p_ca_rt}
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="font-medium text-muted-foreground">
                                                    g CaO / kg
                                                </div>

                                                {/* Magnesium (Mg) Row */}
                                                <div className="font-medium">
                                                    Magnesium
                                                </div>
                                                <div className="flex items-center justify-end">
                                                    {loaderData.editable ? (
                                                        <FormField
                                                            control={
                                                                form.control
                                                            }
                                                            name="p_mg_rt"
                                                            render={({
                                                                field,
                                                            }) => (
                                                                <FormItem className="flex items-center">
                                                                    <FormControl>
                                                                        <Input
                                                                            {...field}
                                                                            className="w-24 text-right"
                                                                        />
                                                                    </FormControl>
                                                                    <FormDescription />
                                                                    <FormMessage />
                                                                </FormItem>
                                                            )}
                                                        />
                                                    ) : (
                                                        <span>
                                                            {fertilizer.p_mg_rt}
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="font-medium text-muted-foreground">
                                                    g MgO / kg
                                                </div>
                                            </div>
                                        </CardContent>
                                        {loaderData.editable && (
                                            <CardFooter className="w-full">
                                                <Button
                                                    type="submit"
                                                    disabled={
                                                        form.formState
                                                            .isSubmitting
                                                    }
                                                >
                                                    {form.formState
                                                        .isSubmitting && (
                                                        <LoadingSpinner />
                                                    )}
                                                    Opslaan
                                                </Button>
                                            </CardFooter>
                                        )}
                                    </Card>
                                </div>
                            </fieldset>
                        </Form>
                    </RemixFormProvider>
                </div>
            </main>
        </SidebarInset>
    )
}
