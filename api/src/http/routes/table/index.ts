import {
    createTableController,
    listTablesController,
} from '@/http/controllers/table/index.js'
import { authorize } from '@/http/hooks/authorize.js'
import { errorResponseSchema } from '@/http/schemas/error-response-schema.js'
import {
    createTableResponseSchema,
    createTableSchema,
    listTablesQuerySchema,
    listTablesResponseSchema,
} from '@/http/schemas/table/index.js'
import { FastifyInstance } from 'fastify'
import { ZodTypeProvider } from 'fastify-type-provider-zod'

export async function createTableRoute(app: FastifyInstance) {
    app.withTypeProvider<ZodTypeProvider>().post(
        '',
        {
            onRequest: [app.authenticate],
            preHandler: [authorize('create', 'Table')],
            config: {
                rateLimit: {
                    max: 20,
                    timeWindow: '1 minute',
                    keyGenerator: (request) => request.user.sub,
                },
            },
            schema: {
                tags: ['Tables'],
                summary: 'Create a poker table',
                description:
                    'Creates a new poker table with game configuration (blinds, buy-ins, rake, player limits). Only administrators can perform this action.',
                security: [
                    {
                        cookieAuth: [],
                    },
                ],
                body: createTableSchema,
                response: {
                    201: createTableResponseSchema,
                    400: errorResponseSchema,
                    401: errorResponseSchema,
                    403: errorResponseSchema,
                    429: errorResponseSchema,
                    500: errorResponseSchema,
                },
            },
        },
        createTableController,
    )
}

export async function listTablesRoute(app: FastifyInstance) {
    app.withTypeProvider<ZodTypeProvider>().get(
        '',
        {
            onRequest: [app.authenticate],
            preHandler: [authorize('read', 'Table')],
            config: {
                rateLimit: {
                    max: 60,
                    timeWindow: '1 minute',
                    keyGenerator: (request) => request.user.sub,
                },
            },
            schema: {
                tags: ['Tables'],
                summary: 'List poker tables',
                description:
                    'Retrieve a paginated list of poker tables with optional filters by status and currency.',
                security: [
                    {
                        cookieAuth: [],
                    },
                ],
                querystring: listTablesQuerySchema,
                response: {
                    200: listTablesResponseSchema,
                    400: errorResponseSchema,
                    401: errorResponseSchema,
                    403: errorResponseSchema,
                    429: errorResponseSchema,
                    500: errorResponseSchema,
                },
            },
        },
        listTablesController,
    )
}
