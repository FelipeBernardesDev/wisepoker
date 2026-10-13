import { env } from './config/env.js'
import { app } from './app.js'
import { logger } from './lib/logger.js'

async function start() {
    try {
        await app.listen({
            port: env.PORT,
            host: env.HOST,
        })
    } catch (err) {
        logger.error(err)
        process.exit(1)
    }
}

start()
