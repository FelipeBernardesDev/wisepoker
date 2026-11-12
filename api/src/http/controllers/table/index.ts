import { CreateTableInput, ListTablesQuery } from '@/http/schemas/table/index.js'
import { createTableService, listTablesService } from '@/services/table/index.js'
import { FastifyReply, FastifyRequest } from 'fastify'

export async function createTableController(
    request: FastifyRequest<{ Body: CreateTableInput }>,
    reply: FastifyReply,
) {
    const table = await createTableService(request.body)

    return reply.status(201).send({ table })
}

export async function listTablesController(
    request: FastifyRequest<{ Querystring: ListTablesQuery }>,
    reply: FastifyReply,
) {
    const result = await listTablesService(request.query)

    return reply.status(200).send(result)
}
