import { fastifyPlugin } from 'fastify-plugin'
import { fastifyJwt } from '@fastify/jwt'
import { env } from '@/config/env.js'
import { FastifyInstance, FastifyRequest } from 'fastify'
import { UnauthorizedError } from '@/errors/index.js'

export default fastifyPlugin(async function authPlugin(app: FastifyInstance) {
    await app.register(fastifyJwt, {
        secret: env.JWT_SECRET,

        cookie: {
            cookieName: 'access_token',
            signed: false,
        },
    })

    app.decorate('authenticate', async function (request: FastifyRequest) {
        try {
            const payload = await request.jwtVerify<{ type: string }>()

            if (payload.type !== 'access') {
                throw new UnauthorizedError('Wrong token type')
            }
        } catch {
            throw new UnauthorizedError('Authentication required')
        }
    })
})
