import { getWalletController } from '@/http/controllers/wallet/index.js'
import { authorize } from '@/http/hooks/authorize.js'
import { errorResponseSchema } from '@/http/schemas/error-response-schema.js'
import { getWalletResponseSchema } from '@/http/schemas/wallet/index.js'
import { FastifyInstance } from 'fastify'
import { ZodTypeProvider } from 'fastify-type-provider-zod'

export async function getWalletRoute(app: FastifyInstance) {
    app.withTypeProvider<ZodTypeProvider>().get(
        '',
        {
            onRequest: [app.authenticate],
            preHandler: [authorize('read', 'Wallet')],
            config: {
                rateLimit: {
                    max: 60,
                    timeWindow: '1 minute',
                    keyGenerator: (request) => request.user.sub,
                },
            },
            schema: {
                tags: ['Wallet'],
                summary: 'Get current user wallet balances',
                description: 'Retrieve accounts and balances of the authenticated user.',
                security: [
                    {
                        cookieAuth: [],
                    },
                ],
                response: {
                    200: getWalletResponseSchema,
                    401: errorResponseSchema,
                    403: errorResponseSchema,
                    404: errorResponseSchema,
                    429: errorResponseSchema,
                    500: errorResponseSchema,
                },
            },
        },
        getWalletController,
    )
}
