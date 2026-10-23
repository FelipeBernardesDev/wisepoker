import { UpdateUserInput } from '@/http/schemas/user/index.js'
import { getProfileService, updateUserService } from '@/services/user/index.js'
import { FastifyReply, FastifyRequest } from 'fastify'

export async function getMeController(request: FastifyRequest, reply: FastifyReply) {
    const { id: userId } = request.server.getCurrentUser(request)

    const user = await getProfileService(userId)

    return reply.status(200).send({ user })
}

export async function updateUserController(
    request: FastifyRequest<{ Body: UpdateUserInput }>,
    reply: FastifyReply,
) {
    const { id: userId } = request.server.getCurrentUser(request)

    const user = await updateUserService(userId, request.body)

    return reply.status(200).send({ user })
}
