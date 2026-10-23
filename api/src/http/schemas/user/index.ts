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

export const updateUserInputSchema = z
    .object({
        userName: z
            .string()
            .trim()
            .min(3, 'Username must be at least 3 characters long')
            .max(30, 'Username must be at most 30 characters long')
            .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores')
            .optional(),

        email: z.email('Please provide a valid email address').optional(),

        avatarUrl: z.url('Please provide a valid URL').nullable().optional(),
    })
    .refine(
        (data) =>
            data.userName !== undefined || data.email !== undefined || data.avatarUrl !== undefined,
        {
            message: 'At least one field must be provided to update',
        },
    )

export const updateUserResponseSchema = z.object({
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
export type UpdateUserInput = z.infer<typeof updateUserInputSchema>
export type UpdateUserResponse = z.infer<typeof updateUserResponseSchema>
