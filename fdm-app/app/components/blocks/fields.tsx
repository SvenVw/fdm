import { Form, useNavigation } from "@remix-run/react";

// Components
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast"
import { FieldMap } from "@/components/blocks/field-map";
import { ClientOnly } from "remix-utils/client-only";
import { Skeleton } from "../ui/skeleton";

export interface soilTypesListType {
    value: string
    label: string
}

export interface fieldType {
    mapboxToken: string;
    b_id: string
    b_name: string
    b_area: number | null
    b_soiltype_agr: string | null
    b_geojson: any
    action: string
}

export interface fieldsType {
    fields: fieldType[]
    mapboxToken: string
    action: string
}

export function Fields(props: fieldsType) {
    return (
        <div className="grid  grid-cols-1 md:grid-cols-2 space-y-6">
            {props.fields.map(field => {
                return (<Field
                    b_id={field.b_id}
                    b_name={field.b_name}
                    b_area={10}
                    b_soiltype_agr={"klei"}
                    b_geojson={field.b_geojson}
                    action={props.action}
                    mapboxToken={props.mapboxToken}
                />)
            })}
        </div>
    )
}

function Field(props: fieldType) {
    const navigation = useNavigation();
    const { toast } = useToast()



    function onSubmit(evt) {
        console.log(evt)
        toast({
            title: "Perceel is bijgewerkt",
            description: "",
        })
    }

    return (
        <div id={props.b_id} className="flex items-center justify-center">
            <Card className="w-2/3">
                <Form className="space-y-6" action={props.action} method="post">
                    <CardHeader>
                        {/* <CardTitle>{props.b_name}</CardTitle>
                        <CardDescription>{props.b_area} ha</CardDescription> */}
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid w-full items-center gap-4">
                                <div>                                    
                                    <Input id="b_id" name="b_id" type= "hidden" value={props.b_id} />
                                </div>
                                <div className="flex flex-col space-y-1.5">
                                    <Label htmlFor="b_name">Perceelsnaam</Label>
                                    <Input id="b_name" name="b_name" placeholder="Bv. Achter de schuur" defaultValue={props.b_name} />
                                </div>
                                <div className="flex flex-col space-y-1.5">
                                    <Label htmlFor="b_lu">Hoofdgewas</Label>
                                    <Select>
                                        <SelectTrigger className="">
                                            <SelectValue placeholder="Select a fruit" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="apple">Apple</SelectItem>
                                            <SelectItem value="banana">Banana</SelectItem>
                                            <SelectItem value="blueberry">Blueberry</SelectItem>
                                            <SelectItem value="grapes">Grapes</SelectItem>
                                            <SelectItem value="pineapple">Pineapple</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <div className="w-full items-center">
                                <ClientOnly
                                    fallback={
                                        <Skeleton className="h-full w-full rounded-xl" />
                                    }                        >
                                    {() => <FieldMap
                                        b_geojson={props.b_geojson}
                                        mapboxToken={props.mapboxToken}
                                    />
                                    }
                                </ClientOnly>
                            </div>
                        </div>
                    </CardContent>
                    <CardFooter className="flex justify-between">
                        <Button type="submit" onClick={onSubmit}>
                            {navigation.state === "submitting"
                                ? "Opslaan..."
                                : "Bijwerken"}
                        </Button>
                    </CardFooter>
                </Form>
            </Card >
        </div>
    )
}
