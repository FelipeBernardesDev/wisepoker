import { AppAbilities, defineAbilityFor } from '@/authorization/index.js'
import { ForbiddenError } from '@/errors/index.js'
import { FastifyReply, FastifyRequest } from 'fastify'

type Action = AppAbilities[0]
type Subject = Extract<AppAbilities[1], string>

export function authorize(action: Action, subject: Subject) {
    return async function (request: FastifyRequest, reply: FastifyReply) {
        const user = request.server.getCurrentUser(request)

        const ability = defineAbilityFor(user)

        request.userAbility = ability

        if (!ability.can(action as any, subject as any)) {
            throw new ForbiddenError('You do not have permission to perform this action')
        }
    }
}
