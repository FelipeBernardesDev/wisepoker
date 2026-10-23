import { getProfileService } from '@/services/user/index.js'
import { FastifyReply, FastifyRequest } from 'fastify'

export async function getMeController(request: FastifyRequest, reply: FastifyReply) {
    const { id: userId } = request.server.getCurrentUser(request)

    const user = await getProfileService(userId)

    return reply.status(200).send({ user })
}
