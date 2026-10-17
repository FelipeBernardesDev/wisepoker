import { z } from 'zod'

export const registerSchema = z
    .object({
        userName: z
            .string()
            .trim()
            .min(3, 'Username must be at least 3 characters long')
            .max(30, 'Username must be at most 30 characters long')
            .regex(
                /^[a-zA-Z0-9_]+$/,
                'Username can only contain letters, numbers, and underscores',
            ),

        email: z.email('Please provide a valid email address'),

        password: z
            .string()
            .min(8, 'Password must be at least 8 characters long')
            .max(128, 'Password must be at most 128 characters long')
            .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
            .regex(/[0-9]/, 'Password must contain at least one number')
            .regex(/^\S+$/, 'Password must not contain whitespace'),

        confirmPassword: z.string(),
    })
    .refine((data) => data.password === data.confirmPassword, {
        message: 'Passwords do not match',
        path: ['confirmPassword'],
    })

export const loginSchema = z.object({
    identifier: z
        .string()
        .trim()
        .min(1, 'Email or username is required')
        .max(255, 'Email or username is too long')
        .regex(/^\S+$/, 'Email or username must not contain whitespace'),

    password: z.string().min(1, 'Password is required'),
})

export type RegisterInput = z.infer<typeof registerSchema>
export type LoginInput = z.infer<typeof loginSchema>
