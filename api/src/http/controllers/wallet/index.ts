import { getWalletService } from '@/services/wallet/index.js'
import { FastifyReply, FastifyRequest } from 'fastify'

export async function getWalletController(request: FastifyRequest, reply: FastifyReply) {
    const { id: userId } = request.server.getCurrentUser(request)

    const wallet = await getWalletService(userId)

    return reply.status(200).send({ wallet })
}
