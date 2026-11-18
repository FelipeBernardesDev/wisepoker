import {
    buyInController,
    createTableController,
    getTableController,
    getTableStateController,
    leaveTableController,
    listTablesController,
    tableWebSocketHandler,
} from '@/http/controllers/table/index.js'
import { authorize } from '@/http/hooks/authorize.js'
import { errorResponseSchema } from '@/http/schemas/error-response-schema.js'
import {
    buyInBodySchema,
    buyInParamsSchema,
    buyInResponseSchema,
    createTableResponseSchema,
    createTableSchema,
    getTableParamsSchema,
    getTableResponseSchema,
    leaveTableResponseSchema,
    listTablesQuerySchema,
    listTablesResponseSchema,
    tableStateResponseSchema,
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

export async function getTableRoute(app: FastifyInstance) {
    app.withTypeProvider<ZodTypeProvider>().get(
        '/:id',
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
                summary: 'Get poker table by ID',
                description:
                    'Retrieve detailed information and configuration of a poker table by its public ID.',
                security: [
                    {
                        cookieAuth: [],
                    },
                ],
                params: getTableParamsSchema,
                response: {
                    200: getTableResponseSchema,
                    400: errorResponseSchema,
                    401: errorResponseSchema,
                    403: errorResponseSchema,
                    404: errorResponseSchema,
                    429: errorResponseSchema,
                    500: errorResponseSchema,
                },
            },
        },
        getTableController,
    )
}

export async function buyInRoute(app: FastifyInstance) {
    app.withTypeProvider<ZodTypeProvider>().post(
        '/:id/buy-in',
        {
            onRequest: [app.authenticate],
            preHandler: [authorize('transfer', 'Wallet')],
            config: {
                rateLimit: {
                    max: 20,
                    timeWindow: '1 minute',
                    keyGenerator: (request) => request.user.sub,
                },
            },
            schema: {
                tags: ['Tables'],
                summary: 'Buy in to a poker table',
                description:
                    'Transfers chips from player MAIN account to IN_PLAY account for joining or adding chips to a poker table.',
                security: [
                    {
                        cookieAuth: [],
                    },
                ],
                params: buyInParamsSchema,
                body: buyInBodySchema,
                response: {
                    200: buyInResponseSchema,
                    400: errorResponseSchema,
                    401: errorResponseSchema,
                    403: errorResponseSchema,
                    404: errorResponseSchema,
                    429: errorResponseSchema,
                    500: errorResponseSchema,
                },
            },
        },
        buyInController,
    )
}

export async function leaveTableRoute(app: FastifyInstance) {
    app.withTypeProvider<ZodTypeProvider>().post(
        '/:id/leave',
        {
            onRequest: [app.authenticate],
            preHandler: [authorize('transfer', 'Wallet')],
            config: {
                rateLimit: {
                    max: 20,
                    timeWindow: '1 minute',
                    keyGenerator: (request) => request.user.sub,
                },
            },
            schema: {
                tags: ['Tables'],
                summary: 'Leave a poker table and cash out',
                description:
                    'Removes the player from the poker table seat and transfers remaining in-play chips back to the MAIN wallet account.',
                security: [
                    {
                        cookieAuth: [],
                    },
                ],
                params: getTableParamsSchema,
                response: {
                    200: leaveTableResponseSchema,
                    400: errorResponseSchema,
                    401: errorResponseSchema,
                    403: errorResponseSchema,
                    404: errorResponseSchema,
                    429: errorResponseSchema,
                    500: errorResponseSchema,
                },
            },
        },
        leaveTableController,
    )
}

export async function getTableStateRoute(app: FastifyInstance) {
    app.withTypeProvider<ZodTypeProvider>().get(
        '/:id/state',
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
                summary: 'Get live poker table state',
                description:
                    'Retrieves real-time poker game state including seated players, stacks, pot, community cards, and visible player cards.',
                security: [
                    {
                        cookieAuth: [],
                    },
                ],
                params: getTableParamsSchema,
                response: {
                    200: tableStateResponseSchema,
                    400: errorResponseSchema,
                    401: errorResponseSchema,
                    403: errorResponseSchema,
                    404: errorResponseSchema,
                    429: errorResponseSchema,
                    500: errorResponseSchema,
                },
            },
        },
        getTableStateController,
    )
}

export async function tableWebSocketRoute(app: FastifyInstance) {
    app.get(
        '/:id/ws',
        {
            websocket: true,
            onRequest: [app.authenticate],
            schema: {
                tags: ['Tables'],
                summary: 'Connect to poker table real-time WebSocket',
                description:
                    'Establishes a bi-directional WebSocket connection for live table updates, seated player notifications, and real-time game events.',
                security: [
                    {
                        cookieAuth: [],
                    },
                ],
                params: getTableParamsSchema,
            },
        },
        tableWebSocketHandler,
    )
}
