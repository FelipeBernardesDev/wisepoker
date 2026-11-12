import { z } from 'zod'

export const tableSchema = z.object({
    id: z.uuid(),
})

export type Table = z.infer<typeof tableSchema>
