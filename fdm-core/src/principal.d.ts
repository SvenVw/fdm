/**
 * @typedef Principal
 * @property {string} username - The username of slug of the principal.
 * @property {string} initials - The initials of the principal.
 * @property {string | null} displayUsername - The display name of the principal (can be null).
 * @property {string | null} image - The image URL of the principal (can be null).
 * @property {"user" | "organization"} type - The type of the principal (either "user" or "organization").
 * @property {boolean} isVerified - Indicates whether the principal is verified.
 */
export type Principal = {
    username: string
    initials: string
    displayUsername: string | null
    image: string | null
    type: "user" | "organization"
    isVerified: boolean
}
