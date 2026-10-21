import {
    loginController,
    logoutController,
    refreshTokenController,
    registerController,
} from '@/http/controllers/auth/index.js'
import { loginSchema, registerSchema } from '@/http/schemas/auth/index.js'
import { errorResponseSchema } from '@/http/schemas/error-response-schema.js'
import { FastifyInstance } from 'fastify'
import { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'

export async function registerRoute(app: FastifyInstance) {
    app.withTypeProvider<ZodTypeProvider>().post(
        '',
        {
            config: {
                rateLimit: {
                    max: 5,
                    timeWindow: '1 minute',
                },
            },
            schema: {
                tags: ['Authorization'],
                summary: 'Register',
                description: 'Create a new user.',
                body: registerSchema,
                response: {
                    201: z.object({
                        user: z.object({
                            id: z.uuid(),
                            userName: z.string(),
                        }),
                    }),
                    400: errorResponseSchema,
                    409: errorResponseSchema,
                    429: errorResponseSchema,
                    500: errorResponseSchema,
                },
            },
        },
        registerController,
    )
}

export async function loginRoute(app: FastifyInstance) {
    app.withTypeProvider<ZodTypeProvider>().post(
        '',
        {
            config: {
                rateLimit: {
                    max: 5,
                    timeWindow: '1 minute',
                },
            },
            schema: {
                tags: ['Authorization'],
                summary: 'Login',
                description: 'Authenticate a user and set session cookies.',
                body: loginSchema,
                response: {
                    200: z.object({
                        user: z.object({
                            id: z.uuid(),
                            userName: z.string(),
                        }),
                    }),
                    400: errorResponseSchema,
                    401: errorResponseSchema,
                    429: errorResponseSchema,
                    500: errorResponseSchema,
                },
            },
        },
        loginController,
    )
}

export async function logoutRoute(app: FastifyInstance) {
    app.withTypeProvider<ZodTypeProvider>().post(
        '',
        {
            onRequest: [app.authenticate],
            schema: {
                tags: ['Authorization'],
                summary: 'Logout',
                description: 'End the current session and clear cookies',
                security: [
                    {
                        cookieAuth: [],
                    },
                ],
                response: {
                    204: z.null(),
                    500: errorResponseSchema,
                },
            },
        },
        logoutController,
    )
}

export async function refreshTokenRoute(app: FastifyInstance) {
    app.withTypeProvider<ZodTypeProvider>().post(
        '',
        {
            config: {
                rateLimit: {
                    max: 10,
                    timeWindow: '1 minute',
                },
            },
            schema: {
                tags: ['Authorization'],
                summary: 'Refresh Token',
                description: 'Issue a new access token using the refresh token cookie.',
                security: [
                    {
                        refreshCookieAuth: [],
                    },
                ],
                response: {
                    200: z.object({
                        user: z.object({
                            id: z.uuid(),
                            userName: z.string(),
                        }),
                    }),
                    401: errorResponseSchema,
                    429: errorResponseSchema,
                    500: errorResponseSchema,
                },
            },
        },
        refreshTokenController,
    )
}
