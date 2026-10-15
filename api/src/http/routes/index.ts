import { FastifyInstance } from 'fastify'
import { healthRoute } from './health/index.js'

export async function routes(app: FastifyInstance) {
    //Health Check
    await app.register(healthRoute, { prefix: '/health' })
}
