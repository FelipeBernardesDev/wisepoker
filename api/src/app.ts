import fastify from 'fastify'
import { logger } from './lib/logger.js'
import { fastifySwagger } from '@fastify/swagger'
import fastifyApiReference from '@scalar/fastify-api-reference'
import {
    serializerCompiler,
    validatorCompiler,
    jsonSchemaTransform,
    type ZodTypeProvider,
} from 'fastify-type-provider-zod'

export const app = fastify({
    loggerInstance: logger,
}).withTypeProvider<ZodTypeProvider>()

app.setSerializerCompiler(serializerCompiler)
app.setValidatorCompiler(validatorCompiler)

app.register(fastifySwagger, {
    openapi: {
        openapi: '3.0.0',
        info: {
            title: 'WisePoker API',
            description: 'API responsible for providing services to the Wisepoker platform.',
            version: '1.0.0',
        },
    },
    transform: jsonSchemaTransform,
})

app.register(fastifyApiReference, {
    routePrefix: '/docs',
})
