import { FarmHeader } from "@/components/custom/farm/farm-header"
import { FarmTitle } from "@/components/custom/farm/farm-title"
import { FormSchema } from "@/components/custom/fertilizer/formschema"
import { Badge } from "@/components/ui/badge"
import {
    Card,
    CardContent,
    CardDescription,
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

        // Return user information from loader
        return {
            farm: farm,
            b_id_farm: b_id_farm,
            farmOptions: farmOptions,
            fertilizer: fertilizer,
            editable: true,
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

    const form = useRemixForm<z.infer<typeof FormSchema>>({
        mode: "onTouched",
        resolver: zodResolver(FormSchema),
        defaultValues: {
            p_n_rt: fertilizer.p_n_rt,
            p_p_rt: fertilizer.p_p_rt,
            p_k_rt: fertilizer.p_k_rt,
            p_om: fertilizer.p_om,
            p_c_rt: fertilizer.p_c_rt,
            p_s_rt: fertilizer.p_s_rt,
            p_ca_rt: fertilizer.p_ca_rt,
            p_mg_rt: fertilizer.p_mg_rt,
        },
    })

    useEffect(() => {
        form.reset({
            p_n_rt: fertilizer.p_n_rt,
            p_p_rt: fertilizer.p_p_rt,
            p_k_rt: fertilizer.p_k_rt,
            p_om: fertilizer.p_om,
            p_c_rt: fertilizer.p_c_rt,
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
                                            <div className="flex flex-col gap-1">
                                                <span className="font-medium">
                                                    Naam
                                                </span>
                                                <span>
                                                    {fertilizer.p_name_nl}
                                                </span>
                                            </div>
                                            <div className="flex flex-col gap-1">
                                                <span className="font-medium">
                                                    Bron
                                                </span>
                                                <span>
                                                    {fertilizer.p_source}
                                                </span>
                                            </div>
                                            {fertilizer.p_description && (
                                                <div className="flex flex-col gap-1">
                                                    <span className="font-medium">
                                                        Omschrijving
                                                    </span>
                                                    <span>
                                                        {
                                                            fertilizer.p_description
                                                        }
                                                    </span>
                                                </div>
                                            )}
                                            {fertilizer.p_type_manure && (
                                                <div className="flex flex-col gap-1">
                                                    <span className="font-medium">
                                                        Type
                                                    </span>
                                                    <Badge variant="secondary">
                                                        Mest
                                                    </Badge>
                                                </div>
                                            )}
                                            {fertilizer.p_type_mineral && (
                                                <div className="flex flex-col gap-1">
                                                    <span className="font-medium">
                                                        Type
                                                    </span>
                                                    <Badge variant="secondary">
                                                        Mineraal
                                                    </Badge>
                                                </div>
                                            )}
                                            {fertilizer.p_type_compost && (
                                                <div className="flex flex-col gap-1">
                                                    <span className="font-medium">
                                                        Type
                                                    </span>
                                                    <Badge variant="secondary">
                                                        Compost
                                                    </Badge>
                                                </div>
                                            )}
                                        </CardContent>
                                    </Card>
                                    <Card className="w-full">
                                        <CardHeader>
                                            <CardTitle>Samenstelling</CardTitle>
                                            <CardDescription>
                                                De gehalten van deze meststof
                                            </CardDescription>
                                        </CardHeader>
                                        <CardContent className="grid grid-cols-1 gap-4">
                                            {fertilizer.p_n_rt !== null && (
                                                <div className="flex items-center justify-between gap-2">
                                                    <span className="font-medium">
                                                        Stikstof (N)
                                                    </span>
                                                    <div className="flex items-center gap-2">
                                                        {loaderData.editable ? (
                                                            <FormField
                                                                control={
                                                                    form.control
                                                                }
                                                                name="p_n_rt"
                                                                render={({
                                                                    field,
                                                                }) => (
                                                                    <FormItem className="flex items-center gap-2">
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
                                                                {
                                                                    fertilizer.p_n_rt
                                                                }
                                                            </span>
                                                        )}
                                                        <span className="font-medium text-muted-foreground">
                                                            g N / kg
                                                        </span>
                                                    </div>
                                                </div>
                                            )}
                                            {fertilizer.p_p_rt !== null && (
                                                <div className="flex items-center justify-between gap-2">
                                                    <span className="font-medium">
                                                        Fosfor (P)
                                                    </span>
                                                    <div className="flex items-center gap-2">
                                                        {loaderData.editable ? (
                                                            <FormField
                                                                control={
                                                                    form.control
                                                                }
                                                                name="p_p_rt"
                                                                render={({
                                                                    field,
                                                                }) => (
                                                                    <FormItem className="flex items-center gap-2">
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
                                                                {
                                                                    fertilizer.p_p_rt
                                                                }
                                                            </span>
                                                        )}
                                                        <span className="font-medium text-muted-foreground">
                                                            {" "}
                                                            g P / kg
                                                        </span>
                                                    </div>
                                                </div>
                                            )}
                                            {fertilizer.p_k_rt !== null && (
                                                <div className="flex items-center justify-between gap-2">
                                                    <span className="font-medium">
                                                        Kalium (K)
                                                    </span>
                                                    <div className="flex items-center gap-2">
                                                        {loaderData.editable ? (
                                                            <FormField
                                                                control={
                                                                    form.control
                                                                }
                                                                name="p_k_rt"
                                                                render={({
                                                                    field,
                                                                }) => (
                                                                    <FormItem className="flex items-center gap-2">
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
                                                                {
                                                                    fertilizer.p_k_rt
                                                                }
                                                            </span>
                                                        )}
                                                        <span className="font-medium text-muted-foreground">
                                                            {" "}
                                                            g K / kg
                                                        </span>
                                                    </div>
                                                </div>
                                            )}
                                            {fertilizer.p_om !== null && (
                                                <div className="flex items-center justify-between gap-2">
                                                    <span className="font-medium">
                                                        Organische stof (OS)
                                                    </span>
                                                    <div className="flex items-center gap-2">
                                                        {loaderData.editable ? (
                                                            <FormField
                                                                control={
                                                                    form.control
                                                                }
                                                                name="p_om"
                                                                render={({
                                                                    field,
                                                                }) => (
                                                                    <FormItem className="flex items-center gap-2">
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
                                                                {
                                                                    fertilizer.p_om
                                                                }
                                                            </span>
                                                        )}
                                                        <span className="font-medium text-muted-foreground">
                                                            {" "}
                                                            g OS / kg
                                                        </span>
                                                    </div>
                                                </div>
                                            )}
                                            {fertilizer.p_c_rt !== null && (
                                                <div className="flex items-center justify-between gap-2">
                                                    <span className="font-medium">
                                                        Koolstof (C)
                                                    </span>
                                                    <div className="flex items-center gap-2">
                                                        {loaderData.editable ? (
                                                            <FormField
                                                                control={
                                                                    form.control
                                                                }
                                                                name="p_c_rt"
                                                                render={({
                                                                    field,
                                                                }) => (
                                                                    <FormItem className="flex items-center gap-2">
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
                                                                {
                                                                    fertilizer.p_c_rt
                                                                }
                                                            </span>
                                                        )}
                                                        <span className="font-medium text-muted-foreground">
                                                            {" "}
                                                            g C / kg
                                                        </span>
                                                    </div>
                                                </div>
                                            )}
                                            {fertilizer.p_s_rt !== null && (
                                                <div className="flex items-center justify-between gap-2">
                                                    <span className="font-medium">
                                                        Zwavel (S)
                                                    </span>
                                                    <div className="flex items-center gap-2">
                                                        {loaderData.editable ? (
                                                            <FormField
                                                                control={
                                                                    form.control
                                                                }
                                                                name="p_s_rt"
                                                                render={({
                                                                    field,
                                                                }) => (
                                                                    <FormItem className="flex items-center gap-2">
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
                                                                {
                                                                    fertilizer.p_s_rt
                                                                }
                                                            </span>
                                                        )}
                                                        <span className="font-medium text-muted-foreground">
                                                            {" "}
                                                            g SO3 / kg
                                                        </span>
                                                    </div>
                                                </div>
                                            )}
                                            {fertilizer.p_ca_rt !== null && (
                                                <div className="flex items-center justify-between gap-2">
                                                    <span className="font-medium">
                                                        Calcium (Ca)
                                                    </span>
                                                    <div className="flex items-center gap-2">
                                                        {loaderData.editable ? (
                                                            <FormField
                                                                control={
                                                                    form.control
                                                                }
                                                                name="p_ca_rt"
                                                                render={({
                                                                    field,
                                                                }) => (
                                                                    <FormItem className="flex items-center gap-2">
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
                                                                {
                                                                    fertilizer.p_ca_rt
                                                                }
                                                            </span>
                                                        )}
                                                        <span className="font-medium text-muted-foreground">
                                                            {" "}
                                                            g Ca / kg
                                                        </span>
                                                    </div>
                                                </div>
                                            )}
                                            {fertilizer.p_mg_rt !== null && (
                                                <div className="flex items-center justify-between gap-2">
                                                    <span className="font-medium">
                                                        Magnesium (Mg)
                                                    </span>
                                                    <div className="flex items-center gap-2">
                                                        {loaderData.editable ? (
                                                            <FormField
                                                                control={
                                                                    form.control
                                                                }
                                                                name="p_mg_rt"
                                                                render={({
                                                                    field,
                                                                }) => (
                                                                    <FormItem className="flex items-center gap-2">
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
                                                                {
                                                                    fertilizer.p_mg_rt
                                                                }
                                                            </span>
                                                        )}
                                                        <span className="font-medium text-muted-foreground">
                                                            {" "}
                                                            g Mg / kg
                                                        </span>
                                                    </div>
                                                </div>
                                            )}
                                        </CardContent>
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
