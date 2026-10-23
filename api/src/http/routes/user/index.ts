import { getMeController, updateUserController } from '@/http/controllers/user/index.js'
import { authorize } from '@/http/hooks/authorize.js'
import { errorResponseSchema } from '@/http/schemas/error-response-schema.js'
import {
    getMeResponseSchema,
    updateUserInputSchema,
    updateUserResponseSchema,
} from '@/http/schemas/user/index.js'
import { FastifyInstance } from 'fastify'
import { ZodTypeProvider } from 'fastify-type-provider-zod'

export async function getMeRoute(app: FastifyInstance) {
    app.withTypeProvider<ZodTypeProvider>().get(
        '',
        {
            onRequest: [app.authenticate],
            preHandler: [authorize('read', 'User')],
            schema: {
                tags: ['Users'],
                summary: 'Get current user profile',
                description: 'Retrieve profile details of the authenticated user.',
                security: [
                    {
                        cookieAuth: [],
                    },
                ],
                response: {
                    200: getMeResponseSchema,
                    401: errorResponseSchema,
                    403: errorResponseSchema,
                    404: errorResponseSchema,
                    500: errorResponseSchema,
                },
            },
        },
        getMeController,
    )
}

export async function updateUserRoute(app: FastifyInstance) {
    app.withTypeProvider<ZodTypeProvider>().put(
        '',
        {
            onRequest: [app.authenticate],
            preHandler: [authorize('update', 'User')],
            schema: {
                tags: ['Users'],
                summary: 'Update current user profile',
                description:
                    'Update profile information (username, email, avatar) of the authenticated user.',
                security: [
                    {
                        cookieAuth: [],
                    },
                ],
                body: updateUserInputSchema,
                response: {
                    200: updateUserResponseSchema,
                    400: errorResponseSchema,
                    401: errorResponseSchema,
                    403: errorResponseSchema,
                    404: errorResponseSchema,
                    409: errorResponseSchema,
                    429: errorResponseSchema,
                    500: errorResponseSchema,
                },
            },
        },
        updateUserController,
    )
}
