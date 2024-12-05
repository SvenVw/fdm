

import { Button } from "@/components/ui/button"
import { Separator } from "../ui/separator"
import { Input } from "../ui/input"
import { Label } from "../ui/label"

import { Combobox } from "../custom/combobox"
import { Form, useFetcher, useNavigation } from "@remix-run/react"
import { FormEvent } from "react"

export function ComboboxFertilizers(props: { options: { value: string, label: string }[], defaultValue?: string, action: string }) {
    const navigation = useNavigation();
    const fetcher = useFetcher();


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

    return (
        <div>
            <Form action={props.action} method="post">
                <input type="hidden" name="form" value="addFertilizer" />
                <div className="grid grid-cols-5 items-end gap-x-3 justify-between">
                    <div className="col-span-2">
                        <Label htmlFor="b_name_farm">Meststof<span className="text-red-500">*</span></Label>
                        <Combobox
                            options={props.options}
                        />
                    </div>
                    <div>
                        <Label htmlFor="b_name_farm">Hoeveelheid<span className="text-red-500">*</span></Label>
                        <Input id="p_app_amount" type="number" name="p_app_amount" placeholder="12 ton/ha" aria-required="true" required />
                    </div>
                    <div>
                        <Label htmlFor="b_name_farm">Datum<span className="text-red-500">*</span></Label>
                        <Input id="p_app_date" name="p_app_date" placeholder="2024-03-05" aria-required="true" required />
                    </div>
                    <div className="justify-self-end">
                        <Button type="submit">
                            {navigation.state === "submitting"
                                ? "Opslaan..."
                                : "Voeg toe"}
                        </Button>
                    </div>
                </div>
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
            </Form>
        </div >
    )
}