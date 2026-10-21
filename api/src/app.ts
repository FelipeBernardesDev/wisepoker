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
import { fastifyCors } from '@fastify/cors'
import { fastifyRateLimit } from '@fastify/rate-limit'
import { fastifyHelmet } from '@fastify/helmet'
import { env } from './config/env.js'
import { routes } from './http/routes/index.js'
import { errorHandler } from './http/error-handler.js'
import { fastifyCookie } from '@fastify/cookie'
import authPlugin from '@/plugins/auth.js'

export const app = fastify({
    loggerInstance: logger,
}).withTypeProvider<ZodTypeProvider>()

app.setSerializerCompiler(serializerCompiler)
app.setValidatorCompiler(validatorCompiler)

app.setErrorHandler(errorHandler)

app.register(fastifyCors, {
    origin: env.CORS_ORIGINS,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    credentials: true,
})

app.register(fastifyRateLimit, {
    global: env.NODE_ENV !== 'test',
    max: env.RATE_LIMIT_MAX,
    timeWindow: '1 minute',
})

app.register(fastifyHelmet, {
    contentSecurityPolicy: {
        directives: {
            scriptSrc: ["'self'", "'sha256-JkA735X2v9G7RiNukJ0TOSrXYxNxIgF+PzWkIeLLnis='"],
            styleSrc: ["'self'", "'unsafe-inline'"],
        },
    },
})

app.register(fastifyCookie, {
    secret: env.COOKIE_SECRET,
})

app.register(authPlugin)

app.register(fastifySwagger, {
    openapi: {
        openapi: '3.0.0',
        info: {
            title: 'WisePoker API',
            description: 'API responsible for providing services to the Wisepoker platform.',
            version: '1.0.0',
        },
        components: {
            securitySchemes: {
                cookieAuth: {
                    type: 'apiKey',
                    in: 'cookie',
                    name: 'access_token',
                },
                refreshCookieAuth: {
                    type: 'apiKey',
                    in: 'cookie',
                    name: 'refresh_token',
                },
            },
        },
    },
    transform: jsonSchemaTransform,
})

app.register(fastifyApiReference, {
    routePrefix: '/docs',
})

app.register(routes, { prefix: '/api/v1' })
