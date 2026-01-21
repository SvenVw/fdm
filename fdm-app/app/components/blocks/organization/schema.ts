import z from "zod"

function isValidSlug(slug: string): boolean {
    // Slug must be lowercase
    if (slug.toLowerCase() !== slug) {
        return false
    }

    // Slug must be at least 3 characters long
    if (slug.length < 3) {
        return false
    }

    // Slug should only contain lowercase letters, numbers, and hyphens
    return /^[a-z0-9-]+$/.test(slug)
}

export const FormSchema = z.object({
    name: z
        .string({
            required_error: "Naam van de organisatie is verplicht",
        })
        .min(3, {
            message:
                "Naam van de organisatie moet minimaal 3 karakters bevatten",
        }),
    slug: z
        .string({
            required_error: "ID de organisatie is verplicht",
        })
        .refine(isValidSlug, {
            message:
                "ID moet minimaal 3 karakters bevatten, enkel kleine letters, cijfers of '-'",
        }),
    description: z.string({}).optional(),
})
