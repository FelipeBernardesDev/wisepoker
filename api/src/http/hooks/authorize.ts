import { defineAbilityFor } from '@/authorization/index.js'
import { ForbiddenError } from '@/errors/index.js'
import { FastifyReply, FastifyRequest } from 'fastify'
import { UserSubject } from '@/authorization/subjects/user.js'

type Action = UserSubject[0]
type Subject = UserSubject[1]

export function authorize(action: Action, subject: Subject) {
    return async function (request: FastifyRequest, reply: FastifyReply) {
        const user = request.server.getCurrentUser(request)

        const ability = defineAbilityFor(user)

        request.userAbility = ability

        if (!ability.can(action, subject)) {
            throw new ForbiddenError('You do not have permission to perform this action')
        }
    }
}
