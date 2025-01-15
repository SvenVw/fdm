

import { Button } from "@/components/ui/button"
import { Separator } from "../ui/separator"
import { Input } from "../ui/input"
import { Label } from "../ui/label"

import { Combobox } from "../custom/combobox"

export function ComboboxCultivations(props: { options: { value: string, label: string }[], defaultValue?: string }) {

    return (
        <div>
            <div className="grid grid-cols-5 items-end gap-x-3 justify-between">
                <div className="col-span-2">
                    <Label htmlFor="b_name_farm">Vanggewas<span className="text-red-500">*</span></Label>
                    <Combobox
                        options={props.options}
                    />
                </div>
                <div>
                    <Label htmlFor="b_name_farm">Zaaidatum<span className="text-red-500">*</span></Label>
                    <Input id="p_app_date" name="p_app_date" placeholder="2024-10-05" aria-required="true" />
                </div>
                <div>
                    <Label htmlFor="b_name_farm">Inwerkdatum<span className="text-red-500">*</span></Label>
                    <Input id="p_app_date" name="p_app_date" placeholder="2025-03-05" aria-required="true" />
                </div>
                <div className="justify-self-end">
                    <Button>Voeg toe</Button>
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
                                    Gele mosterd
                                </p>
                                {/* <p className="text-sm text-muted-foreground">m@example.com</p> */}
                            </div>
                            <div>                            
                                <p className="text-sm font-light leading-none">
                                    2024-10-05
                                </p>
                            </div>
                            <div>
                                <p className="text-sm font-light leading-none">
                                    2025-03-01
                                </p>
                            </div>
                            <div>
                                <Button variant="destructive">Verwijder</Button>
                            </div>
                            {/* </div> */}
                        </div>                       
                    </div>
                </div>
            </div>
        </div >
    )
}