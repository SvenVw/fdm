import { ChevronLeft, ChevronRight } from "lucide-react"
import { useLocation, useMatches, useNavigate, useParams } from "react-router"
import { cn } from "@/app/lib/utils"
import { Button } from "~/components/ui/button"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "~/components/ui/select"

export interface FieldDropdownProps {
    fieldOptions: { b_name: string; b_id: string }[]
    className: string
}

export function FieldDropdown({ className, fieldOptions }: FieldDropdownProps) {
    const params = useParams()
    const matches = useMatches()
    const navigate = useNavigate()
    const location = useLocation()

    const b_id = params.b_id
    const currentIndex = b_id
        ? fieldOptions?.findIndex((option) => option.b_id === b_id)
        : -1
    const setFieldId = (b_id: string) => {
        for (const match of matches) {
            // The capturing group ([^.]+) will be something like overview, fertilizer, cultivation, etc.
            const regexMatch =
                /^routes\/farm\.\$b_id_farm\.\$calendar\.field\.\$b_id\.([^.]+)(?:\._index)?$/.exec(
                    match.id,
                )
            if (regexMatch) {
                navigate(
                    `/farm/${params.b_id_farm}/${params.calendar}/field/${b_id}/${regexMatch[1]}${location.search}`,
                    {
                        replace: true,
                    },
                )
                return
            }
        }
    }
    const advanceField = (amount: number) => () => {
        if (currentIndex > -1) {
            const newIndex = amount + currentIndex
            if (newIndex >= 0 && newIndex < fieldOptions.length) {
                setFieldId(fieldOptions[newIndex].b_id)
            }
        }
    }

    const currentOption = fieldOptions.find(
        (option) => option.b_id === params.b_id,
    )

    return (
        <div className={cn("flex flex-row items-center", className)}>
            <Button
                type="button"
                variant="ghost"
                onClick={advanceField(-1)}
                disabled={currentIndex <= 0}
                className="me-1"
            >
                <ChevronLeft />
            </Button>
            <Select value={currentOption?.b_id} onValueChange={setFieldId}>
                <SelectTrigger className="w-auto grow truncate">
                    <SelectValue placeholder={"Geen perceel geselecteerd"} />
                </SelectTrigger>
                <SelectContent>
                    {fieldOptions.map((option) => (
                        <SelectItem key={option.b_id} value={option.b_id}>
                            {option.b_name}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
            <Button
                type="button"
                variant="ghost"
                onClick={advanceField(1)}
                disabled={currentIndex >= fieldOptions.length - 1}
                className="ms-1"
            >
                <ChevronRight />
            </Button>
        </div>
    )
}
