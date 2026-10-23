import type { FastifyRequest } from 'fastify'
import type { AppAbility } from '@/authorization/index.js'
import type { Role } from '@/authorization/roles.js'

declare module '@fastify/jwt' {
    interface FastifyJWT {
        payload: {
            sub: string
            role: Role
            userName: string
            type: 'access' | 'refresh'
        }
        user: {
            sub: string
            role: Role
            userName: string
            type: 'access' | 'refresh'
        }
    }
}

declare module 'fastify' {
    interface FastifyInstance {
        authenticate: (request: FastifyRequest) => Promise<void>
        getCurrentUser: (request: FastifyRequest) => { id: string; role: Role }
    }

    interface FastifyRequest {
        userAbility: AppAbility
    }
}

