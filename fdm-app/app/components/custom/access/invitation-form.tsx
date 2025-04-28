import { Form, useFetcher } from "react-router-dom"
import { useEffect, useState, useRef } from "react"
import { RemixFormProvider, useRemixForm } from "remix-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import type { z } from "zod"
import { User, Users } from "lucide-react"

import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "~/components/ui/select"
import { Button } from "~/components/ui/button"
import { AutoComplete } from "~/components/custom/autocomplete"
import { LoadingSpinner } from "~/components/custom/loadingspinner"
import { AccessFormSchema } from "~/lib/schemas/access.schema"

// Define the type for the principal object based on usage
type Principal = {
    username: string
    displayUserName: string
    image?: string
    initials: string
    role: "owner" | "advisor" | "researcher"
    type: "user" | "organization"
}

type InvitationFormProps = {
    principals: Principal[]
}

export const InvitationForm = ({ principals }: InvitationFormProps) => {
    const fetcher = useFetcher<{
        username: string
        displayUserName: string
        type: "user" | "organization"
    }[]>() // Add type hint for fetcher data
    const [searchValue, setSearchValue] = useState<string>("")
    const [selectedValue, setSelectedValue] = useState<string>("")
    const [items, setItems] = useState<{ value: string; label: string }[]>([])
    const [isLoading, setIsLoading] = useState<boolean>(false)
    const [debounceTimeout, setDebounceTimeout] =
        useState<NodeJS.Timeout | null>(null)
    const prevSearchValue = useRef<string | null>(null) // Ref for previous search value

    const form = useRemixForm<z.infer<typeof AccessFormSchema>>({
        mode: "onTouched",
        resolver: zodResolver(AccessFormSchema),
        defaultValues: {
            role: "advisor", // Set default role
            intent: "invite_user",
        },
    })

    useEffect(() => {
        console.log(searchValue)
        if (debounceTimeout) {
            clearTimeout(debounceTimeout)
        }
        // Only make the API call if the search value has actually changed
        if (
            searchValue.length >= 1 &&
            prevSearchValue.current !== searchValue
        ) {
            setDebounceTimeout(
                setTimeout(() => {
                    prevSearchValue.current = searchValue // Update the ref
                    setIsLoading(true)
                    fetcher.submit(
                        { identifier: searchValue },
                        { method: "post", action: "/api/lookup/principal" },
                    )
                }, 300),
            )
        } else if (searchValue.length < 1 && !isLoading) {
            setItems([])
        }
        return () => {
            if (debounceTimeout) {
                clearTimeout(debounceTimeout)
            }
        }
    }, [searchValue, debounceTimeout])

    useEffect(() => {
        if (fetcher.data) {
            const principalUsernames = principals.map(
                (principal) => principal.username,
            )
            const filteredItems = fetcher.data
                .filter((item) => !principalUsernames.includes(item.username))
                .map((item) => ({
                    label: item.displayUserName,
                    icon: item.type === "user" ? User : Users,
                    value: item.username,
                }))
            setItems(filteredItems)
        }
        // Stop loading regardless of whether data was found
        setIsLoading(false)
        // Add principals to dependency array as it affects filtering
    }, [fetcher.data, principals])

    return (
        <RemixFormProvider {...form}>
            <Form method="post">
                <fieldset
                    disabled={
                        form.formState.isSubmitting || fetcher.state !== "idle"
                    }
                    className="flex items-center justify-between space-x-4"
                >
                    <AutoComplete
                        className="flex-1"
                        selectedValue={selectedValue}
                        onSelectedValueChange={(value) => {
                            setSelectedValue(value)
                            // Update form value when selected
                            form.setValue("username", value, {
                                shouldTouch: true,
                            })
                        }}
                        searchValue={searchValue}
                        onSearchValueChange={setSearchValue}
                        items={items ?? []}
                        isLoading={isLoading}
                        emptyMessage="Geen gebruikers gevonden"
                        placeholder="Zoek naar een gebruiker of organisatie"
                        form={form} // Pass the form instance
                        name="username" // Name for react-hook-form registration
                    />
                    <div className="flex items-center space-x-2 justify-end">
                        <Select
                            defaultValue={form.getValues("role")}
                            name="role"
                            onValueChange={(value) =>
                                form.setValue(
                                    "role",
                                    value as "owner" | "advisor" | "researcher",
                                )
                            }
                        >
                            <SelectTrigger className="ml-auto w-[150px]">
                                <SelectValue placeholder="Selecteer rol" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="owner">Eigenaar</SelectItem>
                                <SelectItem value="advisor">
                                    Adviseur
                                </SelectItem>
                                <SelectItem value="researcher">
                                    Onderzoeker
                                </SelectItem>
                            </SelectContent>
                        </Select>
                        <Button
                            variant="default"
                            className="shrink-0"
                            name="intent" // Ensure intent is part of submission
                            value="invite_user"
                            type="submit"
                        >
                            {form.formState.isSubmitting ? (
                                <LoadingSpinner />
                            ) : (
                                "Uitnodigen"
                            )}
                        </Button>
                    </div>
                </fieldset>
            </Form>
        </RemixFormProvider>
    )
}
