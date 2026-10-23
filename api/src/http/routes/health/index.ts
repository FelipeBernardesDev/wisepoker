import { errorResponseSchema } from '@/http/schemas/error-response-schema.js'
import { FastifyInstance } from 'fastify'
import { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'

export async function healthRoute(app: FastifyInstance) {
    app.withTypeProvider<ZodTypeProvider>().get(
        '',
        {
            schema: {
                tags: ['Health'],
                summary: 'Health check',
                description: 'Check if the API is working.',
                response: {
                    200: z.object({
                        status: z.string(),
                        timestamp: z.iso.datetime(),
                    }),
                    429: errorResponseSchema,
                    500: errorResponseSchema,
                },
            },
        },
        () => {
            return {
                status: 'ok',
                timestamp: new Date().toISOString(),
            }
        },
    )
}
