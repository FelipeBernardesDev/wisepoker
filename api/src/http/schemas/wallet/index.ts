import { z } from 'zod'

export const accountSchema = z.object({
    id: z.uuid(),
    type: z.union([z.literal('MAIN'), z.literal('IN_PLAY'), z.literal('HOUSE')]),
    currency: z.union([z.literal('PLAY'), z.literal('USD')]),
    balance: z.number(),
    createdAt: z.date(),
})

export const getWalletResponseSchema = z.object({
    wallet: z.object({
        accounts: z.array(accountSchema),
    }),
})

export type AccountResponse = z.infer<typeof accountSchema>
export type GetWalletResponse = z.infer<typeof getWalletResponseSchema>
