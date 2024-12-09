import { useState } from "react";
import { useNavigation, Form } from "@remix-run/react";
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
import { Label } from "@/components/ui/label"
import {
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"

import { MultiSelect } from "@/components/custom/multi-select"


export interface fertilizersListType {
    value: string
    label: string
}

export interface farmType {
    b_name_farm: string | null
    b_fertilizers_organic: string[]
    b_fertilizers_mineral: string[]
    organicFertilizersList: fertilizersListType[]
    mineralFertilizersList: fertilizersListType[]
    action: "/app/addfarm/new"
}

const FormSchema = z.object({
    b_name_farm: z.string().min(3, {
        message: "Naam van bedrijf moet minimaal 3 karakters bevatten",
    }),
})


export function Farm(props: farmType) {
    const navigation = useNavigation();

    const organicFertilizersList = props.organicFertilizersList
    const mineralFertilizersList = props.mineralFertilizersList
    const [selectedOrganicFertilizers, setOrganicFertilizers] = useState<string[]>(props.b_fertilizers_organic);
    const [selectedMineralFertilizers, setMineralFertilizers] = useState<string[]>(props.b_fertilizers_mineral);

    const form = useRemixForm<z.infer<typeof FormSchema>>({
        mode: "onTouched",
        resolver: zodResolver(FormSchema),
        defaultValues: {
            b_name_farm: "",
        },
    })

    return (
        <div className="flex h-screen items-center justify-center">
            <Card className="w-[350px]">
                <RemixFormProvider {...form}>
                    <Form id="formFarm" onSubmit={form.handleSubmit}>
                        {/* <fieldset
                            disabled={navigation.state === "submitting"}
                        > */}
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
                                                    <FormDescription>
                                                        De naam van je bedrijf
                                                    </FormDescription>
                                                    <FormMessage />
                                                </FormItem>

                                            )}
                                        />
                                    </div>
                                    <div className="flex flex-col space-y-1.5">
                                        <Label htmlFor="b_fertilizers_organic">Welke <i>organische</i> meststoffen gebruikt u?</Label>
                                        <MultiSelect
                                            options={organicFertilizersList}
                                            onValueChange={setOrganicFertilizers}
                                            defaultValue={selectedOrganicFertilizers}
                                            placeholder="Selecteer meststoffen"
                                            variant="inverted"
                                            animation={0}
                                            maxCount={10}
                                            name="b_fertilizers_organic"
                                        />
                                    </div>
                                    <div className="flex flex-col space-y-1.5">
                                        <Label htmlFor="b_fertilizers_mineral">Welke <i>minerale</i> meststoffen gebruikt u?</Label>
                                        <MultiSelect
                                            options={mineralFertilizersList}
                                            onValueChange={setMineralFertilizers}
                                            defaultValue={selectedMineralFertilizers}
                                            placeholder="Selecteer meststoffen"
                                            variant="inverted"
                                            animation={0}
                                            maxCount={10}
                                            name="b_fertilizers_mineral"
                                        />
                                    </div>
                                </div>
                            </CardContent>
                            <CardFooter className="flex justify-between">
                                <Button variant="outline">Terug</Button>
                                <Button type="submit">
                                    {navigation.state === "submitting"
                                        ? "Opslaan..."
                                        : "Verder"}
                                </Button>
                            </CardFooter>
                        {/* </fieldset> */}
                    </Form>
                </RemixFormProvider>
            </Card>
        </div>

    )
}
