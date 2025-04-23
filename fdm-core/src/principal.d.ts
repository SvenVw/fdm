/**
 * @typedef Principal
 * @property {string} name - The name of the principal.
 * @property {string | null} image - The image URL of the principal (can be null).
 * @property {"user" | "organization"} type - The type of the principal (either "user" or "organization").
 * @property {boolean} isVerified - Indicates whether the principal is verified.
 */
export type Principal = {
    name: string
    image: string | null
    type: "user" | "organization"
    isVerified: boolean
}
