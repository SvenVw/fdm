import type { UseFormReturn } from "react-hook-form"
import { Form } from "react-router"
import { RemixFormProvider } from "remix-hook-form"
import type { ZodType, z } from "zod"
import { LoadingSpinner } from "~/components/custom/loadingspinner"
import { Badge } from "~/components/ui/badge"
import { Button } from "~/components/ui/button"
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "~/components/ui/card"
import {
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormMessage,
} from "~/components/ui/form"
import { Input } from "~/components/ui/input"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "~/components/ui/select"
import type { Fertilizer } from "./columns"

export function FertilizerForm({
    fertilizer,
    form,
    editable,
    farm,
}: {
    fertilizer: Fertilizer
    form: UseFormReturn<
        z.infer<typeof import("./formschema").FormSchema>,
        ZodType,
        undefined
    >
    editable: boolean
    farm: {
        b_id_farm: string
        b_name_farm: string
    }
}) {
    return (
        <RemixFormProvider {...form}>
            <Form
                id="formFertilizer"
                onSubmit={form.handleSubmit}
                method="post"
            >
                <fieldset disabled={form.formState.isSubmitting}>
                    <div className="flex flex-col space-y-8 lg:flex-row lg:space-x-12 lg:space-y-0">
                        <Card className="w-full">
                            <CardHeader>
                                <CardTitle>Algemene informatie</CardTitle>
                                <CardDescription>
                                    Details over de meststof
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="grid grid-cols-1 gap-4">
                                <div className="flex items-center justify-between gap-2">
                                    <span className="font-medium">Naam</span>
                                    <div className="flex items-center gap-2">
                                        {editable ? (
                                            <FormField
                                                control={form.control}
                                                name="p_name_nl"
                                                render={({ field }) => (
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
                                            <span>{fertilizer.p_name_nl}</span>
                                        )}
                                    </div>
                                </div>
                                <div className="flex items-center justify-between gap-2">
                                    <span className="font-medium">
                                        Catalogus
                                    </span>
                                    <span className="flex items-center gap-2">
                                        {fertilizer.p_source ===
                                        farm.b_id_farm ? (
                                            <Badge variant="default">
                                                {farm.b_name_farm}
                                            </Badge>
                                        ) : (
                                            <Badge variant="default">
                                                {fertilizer.p_source}
                                            </Badge>
                                        )}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between gap-2">
                                    <span className="font-medium">Type</span>
                                    {editable ? (
                                        <FormField
                                            control={form.control}
                                            name="p_type"
                                            render={({ field }) => (
                                                <FormItem className="flex items-center gap-2">
                                                    <Select
                                                        onValueChange={
                                                            field.onChange
                                                        }
                                                        defaultValue={
                                                            field.value
                                                        }
                                                        name={field.name}
                                                        disabled={
                                                            field.disabled
                                                        }
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
                                                <Badge
                                                    className="bg-amber-600 text-white hover:bg-amber-700"
                                                    variant="default"
                                                >
                                                    Mest
                                                </Badge>
                                            ) : null}
                                            {fertilizer.p_type_compost ? (
                                                <Badge
                                                    className="bg-green-600 text-white hover:bg-green-700"
                                                    variant="default"
                                                >
                                                    Compost
                                                </Badge>
                                            ) : null}
                                            {fertilizer.p_type_mineral ? (
                                                <Badge
                                                    className="bg-blue-600 text-white hover:bg-blue-700"
                                                    variant="default"
                                                >
                                                    Kunstmest
                                                </Badge>
                                            ) : null}
                                        </span>
                                    )}
                                </div>
                            </CardContent>
                            {editable && (
                                <CardFooter className="w-full">
                                    <Button
                                        type="submit"
                                        disabled={form.formState.isSubmitting}
                                    >
                                        {form.formState.isSubmitting && (
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
                                    <div className="font-medium">Stikstof</div>
                                    <div className="flex items-center justify-end">
                                        {editable ? (
                                            <FormField
                                                control={form.control}
                                                name="p_n_rt"
                                                render={({ field }) => (
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
                                            <span>{fertilizer.p_n_rt}</span>
                                        )}
                                    </div>
                                    <div className="font-medium text-muted-foreground">
                                        g N / kg
                                    </div>

                                    {/* Stikstof, werkingscoëfficiënt Row */}
                                    <div className="font-medium">
                                        Stikstof, werkingscoëfficiënt
                                    </div>
                                    <div className="flex items-center justify-end">
                                        {editable ? (
                                            <FormField
                                                control={form.control}
                                                name="p_n_wc"
                                                render={({ field }) => (
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
                                            <span>{fertilizer.p_n_wc}</span>
                                        )}
                                    </div>
                                    <div className="font-medium text-muted-foreground">
                                        -
                                    </div>
                                    {/* Fosfaat Row */}
                                    <div className="font-medium">Fosfaat</div>
                                    <div className="flex items-center justify-end">
                                        {editable ? (
                                            <FormField
                                                control={form.control}
                                                name="p_p_rt"
                                                render={({ field }) => (
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
                                            <span>{fertilizer.p_p_rt}</span>
                                        )}
                                    </div>
                                    <div className="font-medium text-muted-foreground">
                                        g P2O5 / kg
                                    </div>

                                    {/* Kalium Row */}
                                    <div className="font-medium">Kalium</div>
                                    <div className="flex items-center justify-end">
                                        {editable ? (
                                            <FormField
                                                control={form.control}
                                                name="p_k_rt"
                                                render={({ field }) => (
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
                                            <span>{fertilizer.p_k_rt}</span>
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
                                        {editable ? (
                                            <FormField
                                                control={form.control}
                                                name="p_om"
                                                render={({ field }) => (
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
                                            <span>{fertilizer.p_om}</span>
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
                                        {editable ? (
                                            <FormField
                                                control={form.control}
                                                name="p_eoc"
                                                render={({ field }) => (
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
                                            <span>{fertilizer.p_eoc}</span>
                                        )}
                                    </div>
                                    <div className="font-medium text-muted-foreground">
                                        g EOC / kg
                                    </div>

                                    {/* Zwavel Row */}
                                    <div className="font-medium">Zwavel</div>
                                    <div className="flex items-center justify-end">
                                        {editable ? (
                                            <FormField
                                                control={form.control}
                                                name="p_s_rt"
                                                render={({ field }) => (
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
                                            <span>{fertilizer.p_s_rt}</span>
                                        )}
                                    </div>
                                    <div className="font-medium text-muted-foreground">
                                        g SO3 / kg
                                    </div>

                                    {/* Calcium (Ca) Row */}
                                    <div className="font-medium">Calcium</div>
                                    <div className="flex items-center justify-end">
                                        {editable ? (
                                            <FormField
                                                control={form.control}
                                                name="p_ca_rt"
                                                render={({ field }) => (
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
                                            <span>{fertilizer.p_ca_rt}</span>
                                        )}
                                    </div>
                                    <div className="font-medium text-muted-foreground">
                                        g CaO / kg
                                    </div>

                                    {/* Magnesium (Mg) Row */}
                                    <div className="font-medium">Magnesium</div>
                                    <div className="flex items-center justify-end">
                                        {editable ? (
                                            <FormField
                                                control={form.control}
                                                name="p_mg_rt"
                                                render={({ field }) => (
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
                                            <span>{fertilizer.p_mg_rt}</span>
                                        )}
                                    </div>
                                    <div className="font-medium text-muted-foreground">
                                        g MgO / kg
                                    </div>
                                </div>
                            </CardContent>
                            {editable && (
                                <CardFooter className="w-full">
                                    <Button
                                        type="submit"
                                        disabled={form.formState.isSubmitting}
                                    >
                                        {form.formState.isSubmitting && (
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
    )
}
