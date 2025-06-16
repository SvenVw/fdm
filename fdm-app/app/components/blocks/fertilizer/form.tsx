import type { z } from "zod"
import type { FormSchema } from "~/components/blocks/fertilizer/formschema"
import { Input } from "~/components/ui/input"
import { Label } from "~/components/ui/label"
import { Textarea } from "~/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "~/components/ui/radio-group"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "~/components/ui/card"
import {
    FormField,
    FormItem,
    FormLabel,
    FormControl,
    FormDescription,
    FormMessage,
} from "~/components/ui/form"
import { cn } from "~/lib/utils"
import { RemixFormProvider } from "remix-hook-form"
import { Form } from "react-router"
import { Button } from "../../ui/button"

// Define types directly to avoid import issues
export type FertilizerParameters = keyof z.infer<typeof FormSchema>

export interface FertilizerParameterDescriptionItem {
    parameter:
        | Exclude<
              FertilizerParameters,
              "p_type_manure" | "p_type_mineral" | "p_type_compost"
          >
        | "p_type" // Add p_type back for description purposes
    unit: string
    type: "numeric" | "enum" | "date" | "text"
    name: string
    description: string
    category:
        | "general"
        | "primary"
        | "secondary"
        | "trace"
        | "heavy_metals"
        | "physical"
    min?: number
    max?: number
    options?: unknown
}

export type FertilizerParameterDescription =
    FertilizerParameterDescriptionItem[]

type FormSchemaKeys = keyof z.infer<typeof FormSchema>

type FertilizerFormNewProps = {
    fertilizerParameters: FertilizerParameterDescription
    form: any
}

export function FertilizerForm({
    fertilizerParameters,
    form,
}: FertilizerFormNewProps) {
    const categories = [
        {
            name: "general",
            title: "Algemeen",
            description: "Algemene informatie over de meststof.",
        },
        {
            name: "physical",
            title: "Fysieke eigenschappen",
            description: "Fysieke eigenschappen van de meststof.",
        },
        {
            name: "primary",
            title: "Primaire nutriënten",
            description: "Belangrijkste nutriënten (N, P, K).",
        },
        {
            name: "secondary",
            title: "Secundaire nutriënten",
            description: "Secundaire nutriënten (S, Mg, Ca, Na).",
        },
        {
            name: "trace",
            title: "Sporenelementen",
            description: "Sporenelementen (Cu, Zn, Co, etc.).",
        },
    ]

    const getParameterInput = (param: FertilizerParameterDescriptionItem) => {
        return (
            <FormField
                control={form.control}
                name={param.parameter as FormSchemaKeys}
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>
                            {param.name} {param.unit && `(${param.unit})`}
                        </FormLabel>
                        <FormControl>
                            {param.parameter === "p_description" ? (
                                <Textarea {...field} />
                            ) : (
                                <Input
                                    type={
                                        param.type === "numeric"
                                            ? "number"
                                            : "text"
                                    }
                                    {...field}
                                />
                            )}
                        </FormControl>
                        {param.description && (
                            <FormDescription>
                                {param.description}
                            </FormDescription>
                        )}
                        <FormMessage />
                    </FormItem>
                )}
            />
        )
    }

    const groupedParameters = fertilizerParameters.reduce(
        (
            acc: Record<string, FertilizerParameterDescription[number][]>,
            param: FertilizerParameterDescription[number],
        ) => {
            // Exclude p_id_catalogue and p_source as they are not user editable
            if (
                param.parameter === "p_id_catalogue" ||
                param.parameter === "p_source" ||
                param.parameter === "p_app_method_options"
            ) {
                return acc
            }
            if (!acc[param.category]) {
                acc[param.category] = []
            }
            acc[param.category].push(param)
            return acc
        },
        {} as Record<string, FertilizerParameterDescription[number][]>,
    )

    return (
        <RemixFormProvider {...form}>
            <Form
                id="formFertilizer"
                onSubmit={form.handleSubmit}
                method="post"
            >
                <fieldset disabled={form.formState.isSubmitting}>
                    <div className="space-y-6">
                        {categories.map((category) => (
                            <Card key={category.name}>
                                <CardHeader>
                                    <CardTitle>{category.title}</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                                        {groupedParameters[category.name]
                                            ?.filter(
                                                (param) =>
                                                    param.parameter !==
                                                        "p_id_catalogue" &&
                                                    param.parameter !==
                                                        "p_source" &&
                                                    param.parameter !==
                                                        "p_app_method_options",
                                            )
                                            .map((param) => (
                                                <div key={param.parameter}>
                                                    {getParameterInput(param)}
                                                </div>
                                            ))}
                                    </div>
                                    {category.name === "general" && (
                                        <FormField
                                            control={form.control}
                                            name="p_type_manure" // Use one of the boolean fields for validation
                                            render={({ field }) => (
                                                <FormItem className="space-y-2 mb-6">
                                                    <FormLabel>
                                                        Type meststof
                                                    </FormLabel>
                                                    <FormControl>
                                                        <RadioGroup
                                                            onValueChange={(
                                                                value: string,
                                                            ) => {
                                                                form.setValue(
                                                                    "p_type_manure",
                                                                    value ===
                                                                        "manure",
                                                                )
                                                                form.setValue(
                                                                    "p_type_mineral",
                                                                    value ===
                                                                        "mineral",
                                                                )
                                                                form.setValue(
                                                                    "p_type_compost",
                                                                    value ===
                                                                        "compost",
                                                                )
                                                            }}
                                                            defaultValue={
                                                                form.getValues(
                                                                    "p_type_manure",
                                                                )
                                                                    ? "manure"
                                                                    : form.getValues(
                                                                            "p_type_mineral",
                                                                        )
                                                                      ? "mineral"
                                                                      : form.getValues(
                                                                              "p_type_compost",
                                                                          )
                                                                        ? "compost"
                                                                        : ""
                                                            }
                                                        >
                                                            <FormItem className="flex items-center space-x-2">
                                                                <FormControl>
                                                                    <RadioGroupItem
                                                                        value="manure"
                                                                        id="manure"
                                                                    />
                                                                </FormControl>
                                                                <FormLabel>
                                                                    Dierlijke
                                                                    mest
                                                                </FormLabel>
                                                            </FormItem>
                                                            <FormItem className="flex items-center space-x-2">
                                                                <FormControl>
                                                                    <RadioGroupItem
                                                                        value="compost"
                                                                        id="compost"
                                                                    />
                                                                </FormControl>
                                                                <FormLabel>
                                                                    Compost
                                                                </FormLabel>
                                                            </FormItem>
                                                            <FormItem className="flex items-center space-x-2">
                                                                <FormControl>
                                                                    <RadioGroupItem
                                                                        value="mineral"
                                                                        id="mineral"
                                                                    />
                                                                </FormControl>
                                                                <FormLabel>
                                                                    Kunstmest
                                                                </FormLabel>
                                                            </FormItem>
                                                        </RadioGroup>
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    )}
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                    <div className="sticky bottom-0 left-0 right-0 border-t bg-background p-4">
                        <Button
                            type="submit"
                            className="w-full"
                            disabled={form.formState.isSubmitting}
                        >
                            {form.formState.isSubmitting
                                ? "Meststof toevoegen..."
                                : "Meststof toevoegen"}
                        </Button>
                    </div>
                </fieldset>
            </Form>
        </RemixFormProvider>
    )
}
