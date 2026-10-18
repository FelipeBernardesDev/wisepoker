import { FastifyInstance } from 'fastify'
import { healthRoute } from './health/index.js'
import { loginRoute, logoutRoute, registerRoute } from './auth/index.js'

export async function routes(app: FastifyInstance) {
    //Health Check
    await app.register(healthRoute, { prefix: '/health' })
    // Authorization
    await app.register(registerRoute, { prefix: '/auth/register' })
    await app.register(loginRoute, { prefix: '/auth/login' })
    await app.register(logoutRoute, { prefix: '/auth/logout' })
}
