import {
    BuyInBody,
    BuyInParams,
    CreateTableInput,
    GetTableParams,
    ListTablesQuery,
} from '@/http/schemas/table/index.js'
import {
    buyInService,
    createTableService,
    getTableService,
    listTablesService,
} from '@/services/table/index.js'
import { FastifyReply, FastifyRequest } from 'fastify'

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
    const { amount } = request.body

    const result = await buyInService({
        tableId,
        userId,
        amount,
    })

    return reply.status(200).send({
        buyIn: {
            transactionId: result.transactionId,
            tableId: result.tableId,
            amount: Number(result.amount),
            currency: result.currency,
            mainBalance: Number(result.mainBalance),
            inPlayBalance: Number(result.inPlayBalance),
        },
    })
}
