import { useState } from "react";
import { Form } from "@remix-run/react";

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
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"

import { MultiSelect } from "@/components/custom/multi-select";


const organicFertilizersList = [
    { value: "diary", label: "Melkveehouderij" },
    { value: "arable", label: "Akkerbouw" },
    { value: "tree_nursery", label: "Boomkwekerij" },
    { value: "bulbs", label: "Bloembollen" },
];

interface farmProps {
    b_name_farm: string;
    b_fertilizers_organic: string[];
}


export default function Farm(props: farmProps) {
    const [selectedOrganicFertilizers, setOrganicFertilizers] = useState<string[]>(props.b_fertilizers_organic);

    return (
        <div className="flex h-screen items-center justify-center">
            <Card className="w-[350px]">
                <Form method="post">
                    <CardHeader>
                        <CardTitle>Bedrijf</CardTitle>
                        <CardDescription>Wat voor soort bedrijf heb je?</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid w-full items-center gap-4">
                            <div className="flex flex-col space-y-1.5">
                                <Label htmlFor="name">Bedrijfsnaam</Label>
                                <Input id="name" placeholder="Bv. Jansen V.O.F." />
                            </div>
                            <div className="flex flex-col space-y-1.5">
                                <Label htmlFor="farm_sector">Welke <i>organische</i> meststoffen gebruikt u?</Label>
                                <MultiSelect
                                    options={organicFertilizersList}
                                    onValueChange={setOrganicFertilizers}
                                    defaultValue={selectedOrganicFertilizers}
                                    placeholder="Selecteer meststoffen"
                                    variant="inverted"
                                    animation={0}
                                    maxCount={10}
                                />
                            </div>
                        </div>
                    </CardContent>
                    <CardFooter className="flex justify-between">
                        <Button variant="outline">Terug</Button>
                        <Button>Verder</Button>
                    </CardFooter>
                </Form>
            </Card>
        </div>

    )
}
