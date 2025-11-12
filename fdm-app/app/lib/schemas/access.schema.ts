/**
 * @file This file defines the Zod schema for validating forms related to user access management.
 *
 * This schema is used to ensure that data submitted from access control forms
 * (e.g., inviting a new user, changing a user's role) is in the correct format
 * before being processed by the server.
 *
 * @packageDocumentation
 */
import { z } from "zod"

/**
 * Zod schema for validating user access management forms.
 *
 * It validates the following fields:
 * - `email`: An optional, valid email string.
 * - `username`: An optional string for the user's name.
 * - `role`: An optional enum, restricted to "owner", "advisor", or "researcher".
 * - `intent`: A required enum that specifies the action being performed, such as
 *   "invite_user", "update_role", or "remove_user".
 */
export const AccessFormSchema = z.object({
    email: z.string().email().optional(),
    username: z.string().optional(),
    role: z.enum(["owner", "advisor", "researcher"]).optional(),
    intent: z.enum(["invite_user", "update_role", "remove_user"]),
})
