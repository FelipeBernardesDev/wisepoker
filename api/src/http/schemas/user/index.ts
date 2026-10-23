import { z } from 'zod'

export const getMeResponseSchema = z.object({
    user: z.object({
        id: z.uuid(),
        userName: z.string(),
        email: z.email(),
        avatarUrl: z.string().nullable(),
        role: z.union([z.literal('ADMIN'), z.literal('PLAYER')]),
        status: z.union([z.literal('ACTIVE'), z.literal('SUSPENDED'), z.literal('BANNED')]),
        createdAt: z.date(),
    }),
})

export type GetMeResponse = z.infer<typeof getMeResponseSchema>
