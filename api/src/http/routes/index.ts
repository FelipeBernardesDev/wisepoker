import { FastifyInstance } from 'fastify'
import { healthRoute } from './health/index.js'
import { loginRoute, logoutRoute, refreshTokenRoute, registerRoute } from './auth/index.js'
import { deleteUserRoute, getMeRoute, updateUserRoute } from './user/index.js'
import { getWalletRoute } from './wallet/index.js'

export async function routes(app: FastifyInstance) {
    //Health Check
    await app.register(healthRoute, { prefix: '/health' })
    // Authorization
    await app.register(registerRoute, { prefix: '/auth/register' })
    await app.register(loginRoute, { prefix: '/auth/login' })
    await app.register(logoutRoute, { prefix: '/auth/logout' })
    await app.register(refreshTokenRoute, { prefix: '/auth/refresh' })
    // Users
    await app.register(getMeRoute, { prefix: '/users/me' })
    await app.register(updateUserRoute, { prefix: '/users/me' })
    await app.register(deleteUserRoute, { prefix: '/users/me' })
    // Wallet
    await app.register(getWalletRoute, { prefix: '/wallet' })
}
