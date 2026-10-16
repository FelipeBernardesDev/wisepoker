import { registerController } from '@/http/controllers/auth/index.js'
import { registerSchema } from '@/http/schemas/auth/index.js'
import { errorResponseSchema } from '@/http/schemas/error-response-schema.js'
import { FastifyInstance } from 'fastify'
import { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'

export async function registerRoute(app: FastifyInstance) {
    app.withTypeProvider<ZodTypeProvider>().post(
        '',
        {
            schema: {
                tags: ['Authorization'],
                summary: 'Register',
                description: 'Create a new user',
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
                    500: errorResponseSchema,
                },
            },
        },
        registerController,
    )
}
