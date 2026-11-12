import { z } from 'zod'

export const tableCurrencySchema = z.enum(['PLAY', 'USD'])
export const tableStatusSchema = z.enum(['WAITING', 'ACTIVE', 'CLOSED'])

export const tableConfigSchema = z
    .object({
        smallBlind: z.number().int().positive('Small blind must be a positive integer'),
        bigBlind: z.number().int().positive('Big blind must be a positive integer'),
        minBuyIn: z.number().int().positive('Min buy-in must be a positive integer'),
        maxBuyIn: z.number().int().positive('Max buy-in must be a positive integer'),
        maxPlayers: z
            .number()
            .int()
            .min(2, 'Table must support at least 2 players')
            .max(10, 'Table cannot exceed 10 players')
            .default(6),
        ante: z.number().int().nonnegative('Ante must be non-negative').optional(),
        rakePercent: z
            .number()
            .min(0, 'Rake percent must be >= 0')
            .max(100, 'Rake percent must be <= 100')
            .optional(),
        rakeCap: z.number().int().nonnegative('Rake cap must be non-negative').optional(),
        noFlopNoDrop: z.boolean().optional(),
        timeBankSeconds: z.number().int().positive().optional(),
        timeBankDeductionSeconds: z.number().int().positive().optional(),
        actionTimeoutSeconds: z.number().int().positive().optional(),
        allowSpectators: z.boolean().optional(),
    })
    .refine((data) => data.bigBlind > data.smallBlind, {
        message: 'Big blind must be greater than small blind',
        path: ['bigBlind'],
    })
    .refine((data) => data.maxBuyIn >= data.minBuyIn, {
        message: 'Max buy-in must be greater than or equal to min buy-in',
        path: ['maxBuyIn'],
    })
    .refine((data) => data.minBuyIn >= data.bigBlind, {
        message: 'Min buy-in must be at least 1 big blind',
        path: ['minBuyIn'],
    })

export const createTableSchema = z.object({
    name: z
        .string()
        .trim()
        .min(3, 'Table name must be at least 3 characters long')
        .max(50, 'Table name must be at most 50 characters long'),
    currency: tableCurrencySchema.default('PLAY'),
    config: tableConfigSchema,
})

export const tableResponseSchema = z.object({
    id: z.uuid(),
    name: z.string(),
    status: tableStatusSchema,
    currency: tableCurrencySchema,
    config: tableConfigSchema,
    createdAt: z.date(),
    updatedAt: z.date(),
})

export const createTableResponseSchema = z.object({
    table: tableResponseSchema,
})

export const getTableParamsSchema = z.object({
    id: z.uuid('Invalid table ID format'),
})

export const getTableResponseSchema = z.object({
    table: tableResponseSchema,
})

export const listTablesQuerySchema = z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    status: tableStatusSchema.optional(),
    currency: tableCurrencySchema.optional(),
})

export const listTablesResponseSchema = z.object({
    tables: z.array(tableResponseSchema),
    pagination: z.object({
        page: z.number(),
        limit: z.number(),
        total: z.number(),
        totalPages: z.number(),
    }),
})

export type CreateTableInput = z.infer<typeof createTableSchema>
export type TableConfig = z.infer<typeof tableConfigSchema>
export type TableResponse = z.infer<typeof tableResponseSchema>
export type CreateTableResponse = z.infer<typeof createTableResponseSchema>
export type GetTableParams = z.infer<typeof getTableParamsSchema>
export type GetTableResponse = z.infer<typeof getTableResponseSchema>
export type ListTablesQuery = z.infer<typeof listTablesQuerySchema>
export type ListTablesResponse = z.infer<typeof listTablesResponseSchema>
