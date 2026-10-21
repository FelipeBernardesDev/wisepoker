import { FastifyInstance } from 'fastify'
import { healthRoute } from './health/index.js'
import { loginRoute, logoutRoute, refreshTokenRoute, registerRoute } from './auth/index.js'

export async function routes(app: FastifyInstance) {
    //Health Check
    await app.register(healthRoute, { prefix: '/health' })
    // Authorization
    await app.register(registerRoute, { prefix: '/auth/register' })
    await app.register(loginRoute, { prefix: '/auth/login' })
    await app.register(logoutRoute, { prefix: '/auth/logout' })
    await app.register(refreshTokenRoute, { prefix: '/auth/refresh' })
}
