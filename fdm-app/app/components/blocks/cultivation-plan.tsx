import { useState } from "react";
import { Form, useLocation, useNavigation } from "@remix-run/react";

import { cn } from "@/lib/utils"
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
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

export default function Cultivation(props: { action: string | undefined; }) {
    const navigation = useNavigation();

    // Get sowing and harvesting dates
    const [dateSowing, setDateSowing] = useState<Date | undefined>(new Date('2024-03-01'))
    const [dateHarvesting, setDateHarvesting] = useState<Date | undefined>(new Date('2024-10-01'))


    return (
        <div className="space-y-6">            
            <div>
                <p className="text-sm text-muted-foreground">
                    Werk de opbrengst, stikstofgehalte en zaai- en oogstdatum bij voor dit gewas.
                </p>
            </div>       
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
                        <Input id="b_name_farm" type="number" name="b_name_farm" placeholder="4 kg N / ton DS" aria-required="true" />
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
                </div>
            </Form>
        </div>
    )
}