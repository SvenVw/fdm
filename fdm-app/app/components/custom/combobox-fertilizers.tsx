import { Form, useFetcher, useNavigation } from "react-router"
import { format } from "date-fns"
import { useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useRemixForm, RemixFormProvider } from "remix-hook-form"
import { z } from "zod"

// Components
import { CalendarIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import {
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import { Combobox } from "@/components/custom/combobox"

import { cn } from "@/lib/utils"
import { LoadingSpinner } from "./loadingspinner"

export const FormSchema = z.object({
    p_app_amount: z.coerce.number({
        required_error: "Hoeveelheid is verplicht",
        invalid_type_error: "Hoeveelheid moet een getal zijn",
    }).positive({
        message: "Hoeveelheid moet positief zijn",
    }).finite({
        message: "Hoeveelheid moet een geheel getal zijn",
    }).safe({
        message: "Hoeveelheid moet een safe getal zijn",
    }),
    p_app_date: z.coerce.date({
        required_error: "Datum is verplicht",
        invalid_type_error: "Datum is ongeldig",
    }),
})

export function ComboboxFertilizers(props: { options: { value: string, label: string }[], defaultValue?: string, action: string }) {
    const navigation = useNavigation();
    const fetcher = useFetcher();

    const form = useRemixForm<z.infer<typeof FormSchema>>({
        mode: "onTouched",
        resolver: zodResolver(FormSchema),
        defaultValues: {
            p_app_amount: 0,
            p_app_date: new Date(),
        },
    })


    // async function handleClickOnSubmitAddFertilizer(e: FormEvent) {

    //     e.currentTarget
    //     const formData = new FormData(e.currentTarget);
    //     formData.append("actionForm", 'addFertilizer')
    //     console.log(e.currentTarget)

    //     await fetcher.submit(formData, {
    //         method: "POST",
    //     })


    // }
    async function handleClickOnSubmitRemoveFertilizer() {

        const formData = new FormData();
        formData.append("actionForm", 'removeFertilizer')

        await fetcher.submit(formData, {
            method: "POST",
        })
    }

    const [date, setDate] = useState()

    return (
        <div>
            <RemixFormProvider {...form}>
                <Form id="formAddFertilizerApplication" action={props.action} onSubmit={form.handleSubmit} method="POST">
                    <fieldset
                        disabled={form.formState.isSubmitting}
                    >
                        <input type="hidden" name="form" value="addFertilizerApplication" />
                        <div className="grid grid-cols-5 items-end gap-x-3 justify-between">
                            <div className="col-span-2">
                                {/* <Label htmlFor="b_name_farm">Meststof<span className="text-red-500">*</span></Label>
                                <Combobox
                                    options={props.options}
                                /> */}
                            </div>
                            <div>
                            <FormField
                                control={form.control}
                                name="p_app_amount"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Hoeveelheid<span className="text-red-500">*</span></FormLabel>
                                        <FormControl>
                                            <Input {...field} type="number" value={field.value === 0 ? '' : field.value} placeholder="12 ton/ha" aria-required="true" required />
                                        </FormControl>
                                        <FormDescription />
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            </div>
                            
                            <div>
                            <FormField
                                control={form.control}
                                name="p_app_date"
                                render={({ field }) => (
                                    <FormItem className="">
                                        <FormLabel>Datum</FormLabel>
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <FormControl>
                                                    <Button
                                                        variant={"outline"}
                                                        className={cn(
                                                            "w-full text-left font-normal",
                                                            !field.value && "text-muted-foreground"
                                                        )}
                                                    >
                                                        {field.value ? (
                                                            format(field.value, "yyyy-MM-dd")
                                                        ) : (
                                                            <span>Kies een datum</span>
                                                        )}
                                                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                                    </Button>
                                                </FormControl>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-auto p-0" align="start">
                                                <Calendar
                                                    mode="single"
                                                    selected={field.value}
                                                    onSelect={field.onChange}
                                                    // disabled={(date) =>
                                                    //     date > new Date() || date < new Date("1900-01-01")
                                                    // }
                                                    initialFocus
                                                />
                                            </PopoverContent>
                                        </Popover>
                                        <FormDescription />
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            </div>
                            
                            {/* <div>
                                <Label htmlFor="p_app_date">Datum<span className="text-red-500">*</span></Label>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant={"outline"}
                                            className={cn(
                                                "justify-start text-left font-normal",
                                                !date && "text-muted-foreground"
                                            )}
                                        >
                                            <CalendarIcon />
                                            {date ? format(date, "yyyy-MM-dd") : <span>Kies een datum</span>}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0" align="start">
                                        <Calendar
                                            mode="single"
                                            selected={date}
                                            onSelect={setDate}
                                            initialFocus
                                        />
                                    </PopoverContent>
                                </Popover>
                            </div> */}
                            <div className="justify-self-end">
                                {/* <Button type="submit">
                                    {navigation.state === "submitting"
                                        ? "Opslaan..."
                                        : "Voeg toe"}
                                </Button> */}
                                <Button type="submit">
                                    {form.formState.isSubmitting
                                        ? <div className="flex items-center space-x-2">
                                            <LoadingSpinner />
                                            <span>Opslaan...</span>
                                        </div>
                                        : "Voeg toe"}
                                </Button>
                            </div>
                        </div>
                    </fieldset>
                </Form>
            </RemixFormProvider>
            <div>
                <Separator className="my-4" />
                <div className="space-y-4">
                    {/* <div className="text-sm font-medium">Meststoffen</div> */}
                    <div className="grid gap-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium leading-none">
                                    Runderdrijfmest
                                </p>
                                {/* <p className="text-sm text-muted-foreground">m@example.com</p> */}
                            </div>
                            <div>
                                <p className="text-sm font-light leading-none">
                                    30 ton / ha
                                </p>
                            </div>
                            <div>
                                <p className="text-sm font-light leading-none">
                                    2024-04-01
                                </p>
                            </div>
                            <div>
                                <Button variant="destructive">Verwijder</Button>
                            </div>
                            {/* </div> */}
                        </div>
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium leading-none">
                                    Runderdrijfmest
                                </p>
                                {/* <p className="text-sm text-muted-foreground">m@example.com</p> */}
                            </div>
                            <div>
                                <p className="text-sm font-light leading-none">
                                    30 ton / ha
                                </p>
                            </div>
                            <div>
                                <p className="text-sm font-light leading-none">
                                    2024-04-01
                                </p>
                            </div>
                            <div>
                                <Button variant="destructive">Verwijder</Button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div >
    )
}