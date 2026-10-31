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

export const ledgerEntrySchema = z.object({
    id: z.uuid(),
    amount: z.number(),
    type: z.union([
        z.literal('DEPOSIT'),
        z.literal('WITHDRAWAL'),
        z.literal('BUY_IN'),
        z.literal('CASH_OUT'),
        z.literal('RAKE'),
        z.literal('FREE_CLAIM'),
    ]),
    referenceId: z.string().nullable(),
    account: z.object({
        id: z.uuid(),
        type: z.union([z.literal('MAIN'), z.literal('IN_PLAY'), z.literal('HOUSE')]),
        currency: z.union([z.literal('PLAY'), z.literal('USD')]),
    }),
    createdAt: z.date(),
})

export const getLedgerQuerySchema = z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    type: z
        .union([
            z.literal('DEPOSIT'),
            z.literal('WITHDRAWAL'),
            z.literal('BUY_IN'),
            z.literal('CASH_OUT'),
            z.literal('RAKE'),
            z.literal('FREE_CLAIM'),
        ])
        .optional(),
})

export const getLedgerResponseSchema = z.object({
    ledger: z.object({
        entries: z.array(ledgerEntrySchema),
        pagination: z.object({
            page: z.number(),
            limit: z.number(),
            total: z.number(),
            totalPages: z.number(),
        }),
    }),
})

export type LedgerEntryResponse = z.infer<typeof ledgerEntrySchema>
export type GetLedgerQuery = z.infer<typeof getLedgerQuerySchema>
export type GetLedgerResponse = z.infer<typeof getLedgerResponseSchema>
