import { Form } from "react-router";
import { zodResolver } from "@hookform/resolvers/zod"
import { useRemixForm, RemixFormProvider } from "remix-hook-form"
import { z } from "zod"

import { Button } from "@/components/ui/button"
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import { LoadingSpinner } from "../custom/loadingspinner";

export interface fertilizersListType {
    value: string
    label: string
}

export interface farmType {
    b_name_farm: string | null
    action: "/create/farm/new"
    FormSchema: z.Schema<any>
}

/**
 * Renders the Farm component, which displays the farm form with validation.
 * @param props - Properties of type `farmType`, including form data and validation schema.
 * @returns The JSX element representing the farm form.
 */
export function Farm(props: farmType) {
    const FormSchema = props.FormSchema

    const form = useRemixForm<z.infer<typeof FormSchema>>({
        mode: "onTouched",
        resolver: zodResolver(FormSchema),
        defaultValues: {
            b_name_farm: props.b_name_farm ?? "",
        },
    })

    return (
        <div className="flex h-screen items-center justify-center">
            <Card className="w-[350px]">
                <RemixFormProvider {...form}>
                    <Form id="formFarm" onSubmit={form.handleSubmit} method="POST">
                        <fieldset
                            disabled={form.formState.isSubmitting}
                        >
                            <CardHeader>
                                <CardTitle>Bedrijf</CardTitle>
                                <CardDescription>Wat voor soort bedrijf heb je?</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="grid w-full items-center gap-4">
                                    <div className="flex flex-col space-y-1.5">
                                        <FormField
                                            control={form.control}
                                            name="b_name_farm"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Bedrijfsnaam <span className="text-red-500">*</span></FormLabel>
                                                    <FormControl>
                                                        <Input placeholder="Bv. Jansen V.O.F." aria-required="true" {...field} />
                                                    </FormControl>
                                                    <FormDescription />
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                </div>
                            </CardContent>
                            <CardFooter className="flex justify-between">
                                <Button variant="outline" onClick={() => window.history.back()}>Terug</Button>
                                <Button type="submit">
                                    {form.formState.isSubmitting
                                        ? <div className="flex items-center space-x-2">
                                            <LoadingSpinner />
                                            <span>Opslaan...</span>
                                        </div>
                                        : "Volgende"}
                                </Button>
                            </CardFooter>
                        </fieldset>
                    </Form>
                </RemixFormProvider>
            </Card>
        </div>

    )
}
