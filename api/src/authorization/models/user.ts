import { z } from 'zod'
import { roleSchema } from '../roles.js'

export const userSchema = z.object({
    id: z.uuid(),
    role: roleSchema,
})

export type User = z.infer<typeof userSchema>
