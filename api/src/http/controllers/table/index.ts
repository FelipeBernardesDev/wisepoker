import {
    BuyInBody,
    BuyInParams,
    CreateTableInput,
    GetTableParams,
    ListTablesQuery,
    TableConfig,
} from '@/http/schemas/table/index.js'
import {
    buyInService,
    createTableService,
    getTableService,
    getTableStateService,
    leaveTableService,
    listTablesService,
} from '@/services/table/index.js'
import { FastifyReply, FastifyRequest } from 'fastify'
import { tableManager } from '@/game/table-manager.js'
import { prisma } from '@/lib/prisma.js'
import type { WebSocket } from 'ws'

export async function createTableController(
    request: FastifyRequest<{ Body: CreateTableInput }>,
    reply: FastifyReply,
) {
    const table = await createTableService(request.body)

    return reply.status(201).send({ table })
}

export async function getTableController(
    request: FastifyRequest<{ Params: GetTableParams }>,
    reply: FastifyReply,
) {
    const table = await getTableService(request.params.id)

    return reply.status(200).send({ table })
}

export async function listTablesController(
    request: FastifyRequest<{ Querystring: ListTablesQuery }>,
    reply: FastifyReply,
) {
    const result = await listTablesService(request.query)

    return reply.status(200).send(result)
}

export async function buyInController(
    request: FastifyRequest<{
        Params: BuyInParams
        Body: BuyInBody
    }>,
    reply: FastifyReply,
) {
    const { id: userId } = request.server.getCurrentUser(request)
    const { id: tableId } = request.params
    const { amount, seat } = request.body

    const result = await buyInService({
        tableId,
        userId,
        amount,
        seat,
    })

    return reply.status(200).send({
        buyIn: {
            transactionId: result.transactionId,
            tableId: result.tableId,
            seat: result.seat,
            amount: Number(result.amount),
            currency: result.currency,
            mainBalance: Number(result.mainBalance),
            inPlayBalance: Number(result.inPlayBalance),
        },
    })
}

export async function leaveTableController(
    request: FastifyRequest<{ Params: GetTableParams }>,
    reply: FastifyReply,
) {
    const { id: userId } = request.server.getCurrentUser(request)
    const { id: tableId } = request.params

    const result = await leaveTableService({
        tableId,
        userId,
    })

    return reply.status(200).send({
        cashOut: {
            transactionId: result.transactionId,
            tableId: result.tableId,
            amount: Number(result.amount),
            currency: result.currency,
            mainBalance: Number(result.mainBalance),
            inPlayBalance: Number(result.inPlayBalance),
        },
    })
}

export async function getTableStateController(
    request: FastifyRequest<{ Params: GetTableParams }>,
    reply: FastifyReply,
) {
    const { id: userId } = request.server.getCurrentUser(request)
    const { id: tableId } = request.params

    const result = await getTableStateService({
        tableId,
        userId,
    })

    return reply.status(200).send(result)
}

export async function tableWebSocketHandler(
    socket: WebSocket,
    request: FastifyRequest<{ Params: GetTableParams }>,
) {
    const { id: userId } = request.server.getCurrentUser(request)
    const { id: tableId } = request.params

    const table = await prisma.table.findUnique({
        where: { publicId: tableId },
        select: {
            publicId: true,
            status: true,
            config: true,
        },
    })

    if (!table || table.status === 'CLOSED') {
        socket.send(
            JSON.stringify({
                type: 'ERROR',
                message: !table ? 'Table not found' : 'Table is closed',
            }),
        )
        socket.close()
        return
    }

    const config = table.config as unknown as TableConfig

    // Registra conexão no TableManager
    tableManager.addConnection(tableId, socket, userId)

    // Envia estado inicial da mesa com visão segura para este usuário
    const state = tableManager.getView(tableId, config, userId)
    socket.send(
        JSON.stringify({
            type: 'TABLE_CONNECTED',
            tableId,
            userId,
            state,
        }),
    )

    socket.on('message', (raw) => {
        try {
            const message = JSON.parse(raw.toString())
            if (message.type === 'PING') {
                socket.send(JSON.stringify({ type: 'PONG', timestamp: Date.now() }))
            } else if (message.type === 'GET_STATE') {
                const currentState = tableManager.getView(tableId, config, userId)
                socket.send(
                    JSON.stringify({
                        type: 'TABLE_STATE',
                        tableId,
                        state: currentState,
                    }),
                )
            }
        } catch {
            socket.send(
                JSON.stringify({
                    type: 'ERROR',
                    message: 'Invalid JSON message payload',
                }),
            )
        }
    })
}
