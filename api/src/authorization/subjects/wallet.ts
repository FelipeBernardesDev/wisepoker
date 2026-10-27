import { z } from 'zod'
import { walletSchema } from '../models/wallet.js'

export const walletSubject = z.tuple([
    z.union([
        z.literal('manage'),
        z.literal('get'),
        z.literal('read'),
        z.literal('update'),
        z.literal('delete'),
        z.literal('deposit'),
        z.literal('withdraw'),
        z.literal('transfer'),
    ]),
    z.union([
        z.literal('Wallet'),
        walletSchema,
        z.custom<InstanceType<{ new (): { id: string; userId: string } }>>(),
    ]),
])

export type WalletSubject = z.infer<typeof walletSubject>
