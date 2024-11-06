import { useState } from "react";
import { useNavigation, Form } from "@remix-run/react";

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
    action: "/setup/farm"
}

export function Farm(props: farmType) {
    const organicFertilizersList = props.organicFertilizersList
    const mineralFertilizersList = props.mineralFertilizersList
    const [selectedOrganicFertilizers, setOrganicFertilizers] = useState<string[]>(props.b_fertilizers_organic);
    const [selectedMineralFertilizers, setMineralFertilizers] = useState<string[]>(props.b_fertilizers_mineral);

    const navigation = useNavigation();

    return (
        <div className="flex h-screen items-center justify-center">
            <Card className="w-[350px]">
                <Form method="post" action={props.action}>
                    <fieldset
                        disabled={navigation.state === "submitting"}
                    >
                        <CardHeader>
                            <CardTitle>Bedrijf</CardTitle>
                            <CardDescription>Wat voor soort bedrijf heb je?</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid w-full items-center gap-4">
                                <div className="flex flex-col space-y-1.5">
                                    <Label htmlFor="b_name_farm">Bedrijfsnaam</Label>
                                    <Input id="b_name_farm" name="b_name_farm" placeholder="Bv. Jansen V.O.F." />
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
                    </fieldset>
                </Form>
            </Card>
        </div>

    )
}
