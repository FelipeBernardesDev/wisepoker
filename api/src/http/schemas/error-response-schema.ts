import { z } from 'zod'

export const errorResponseSchema = z.object({
    statusCode: z.number(),
    code: z.string(),
    message: z.string(),
    details: z.array(z.object({ field: z.string(), message: z.string() })).optional(),
})
