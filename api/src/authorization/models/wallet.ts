import { z } from 'zod'

export const walletSchema = z.object({
    id: z.uuid(),
    userId: z.uuid(),
})

export type Wallet = z.infer<typeof walletSchema>
