import fastify from 'fastify'
import { logger } from './lib/logger.js'

export const app = fastify({
    loggerInstance: logger,
})
