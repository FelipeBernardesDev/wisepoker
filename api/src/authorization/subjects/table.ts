import { z } from 'zod'
import { tableSchema } from '../models/table.js'

export const tableSubject = z.tuple([
    z.union([
        z.literal('manage'),
        z.literal('get'),
        z.literal('read'),
        z.literal('create'),
        z.literal('update'),
        z.literal('delete'),
    ]),
    z.union([
        z.literal('Table'),
        tableSchema,
        z.custom<InstanceType<{ new (): { id: string } }>>(),
    ]),
])

export type TableSubject = z.infer<typeof tableSubject>
