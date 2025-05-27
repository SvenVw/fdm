import { z } from "zod"

export const AccessFormSchema = z.object({
    email: z.string().email().optional(),
    username: z.string().optional(),
    role: z.enum(["owner", "advisor", "researcher"]).optional(),
    intent: z.enum(["invite_user", "update_role", "remove_user"]),
})
