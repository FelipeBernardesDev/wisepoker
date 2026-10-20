import { fastifyPlugin } from 'fastify-plugin'
import { fastifyJwt } from '@fastify/jwt'
import { env } from '@/config/env.js'
import { FastifyInstance, FastifyRequest } from 'fastify'
import { UnauthorizedError } from '@/errors/index.js'

export default fastifyPlugin(async function authPlugin(app: FastifyInstance) {
    app.register(fastifyJwt, {
        secret: env.JWT_SECRET,

        cookie: {
            cookieName: 'access_token',
            signed: false,
        },
    })

    app.decorate('authenticate', async function (request: FastifyRequest) {
        try {
            await request.jwtVerify()
        } catch {
            throw new UnauthorizedError('Authentication required')
        }
    })
})
