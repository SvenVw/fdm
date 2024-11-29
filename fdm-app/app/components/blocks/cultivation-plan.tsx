import { Form, useLocation, useNavigation } from "@remix-run/react";

import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
// import { nl } from "react-day-picker/locale" // Could not be found somehow

interface SidebarNavProps extends React.HTMLAttributes<HTMLElement> {
    items: {
        href: string
        title: string
    }[]
}

export function SidebarNav({ className, items, ...props }: SidebarNavProps) {
    const { pathname } = useLocation();

    return (
        <nav
            className={cn(
                "flex space-x-2 lg:flex-col lg:space-x-0 lg:space-y-1 truncate",
                className
            )}
            {...props}
        >
            {items.map((item) => (
                <a
                    key={item.href}
                    href={item.href}
                    className={cn(
                        buttonVariants({ variant: "ghost" }),
                        pathname === item.href
                            ? "bg-muted hover:bg-muted"
                            : "hover:bg-transparent hover:underline",
                        "justify-start"
                    )}
                >
                    {item.title}
                </a>
            ))}
        </nav>
    )
}

import { Separator } from "@/components/ui/separator"
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { useState } from "react";
import { ComboboxFertilizers } from "../custom/combobox-fertilizers";

export default function Cultivation(props) {
    const navigation = useNavigation();

    // Get sowing and harvesting dates
    const [dateSowing, setDateSowing] = useState<Date | undefined>(new Date('2024-03-01'))
    const [dateHarvesting, setDateHarvesting] = useState<Date | undefined>(new Date('2024-10-01'))

    // Get field names
    let fieldNames = props.cultivation.fields.map(field => field.b_name)
    if (fieldNames.length > 1) {
        fieldNames = fieldNames.join(", ")
        fieldNames = fieldNames.replace(/,(?=[^,]+$)/, ', en') //Replace last comma with and        
    }

    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-lg font-medium">{props.cultivation.b_lu_name}</h3>
                <p className="text-sm text-muted-foreground">
                    {fieldNames}
                </p>
            </div>
            <div>
            <p className="text-sm text-muted-foreground">
                    Werk de opbrengst, stikstofgehalte en zaai- en oogstdatum bij voor dit gewas.
                </p>                
            </div>
            <Separator />
            <Form method="post" action={props.action}>
                <fieldset
                    disabled={navigation.state === "submitting"}
                >
                </fieldset>
                <div className="grid w-full items-center gap-4">
                    <div className="flex flex-col space-y-1.5">
                        <Label htmlFor="b_name_farm">Opbrengst (ton ds/ ha) <span className="text-red-500">*</span></Label>
                        <Input id="b_name_farm" type="number" name="b_name_farm" placeholder="37 ton ds / ha" aria-required="true" />
                    </div>
                    <div className="flex flex-col space-y-1.5">
                        <Label htmlFor="b_name_farm">Stikstofgehalte gewas (kg N / ton DS) <span className="text-red-500">*</span></Label>
                        <Input id="b_name_farm" type="number" name="b_name_farm" placeholder="Bv. Jansen V.O.F." aria-required="true" />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex flex-col space-y-1.5">
                            <Label htmlFor="b_name_farm">Zaaidatum</Label>
                            <Calendar
                                // locale={nl} TODO: library has installation issues somehow                                
                                mode="single"
                                selected={dateSowing}
                                onSelect={setDateSowing}
                                className="rounded-md border"
                                weekStartsOn={1}
                                month={dateSowing}                                
                            />
                        </div>
                        <div className="flex flex-col space-y-1.5">
                            <Label htmlFor="b_name_farm">Oogstdatum</Label>
                            <Calendar
                                // locale={nl} TODO: library has installation issues somehow                                                           
                                mode="single"
                                selected={dateHarvesting}
                                onSelect={setDateHarvesting}
                                className="rounded-md border"
                                weekStartsOn={1}
                                month={dateHarvesting}                               
                            />
                        </div>
                    </div>
                    <Separator />
                    <h3 className="text-lg font-medium">Bemesting</h3>
                    <p className="text-sm text-muted-foreground">
                        Vul de bemesting voor dit gewas in
                    </p>
                    <ComboboxFertilizers
                        options={props.fertilizerOptions}
                    />
                    <Separator />
                    <h3 className="text-lg font-medium">Vanggewas</h3>
                </div>
            </Form>
        </div>
    )
}