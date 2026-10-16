import { AppError } from '@/errors/app-error.js'
import type { FastifyError, FastifyReply, FastifyRequest } from 'fastify'
import { hasZodFastifySchemaValidationErrors } from 'fastify-type-provider-zod'
import { Prisma } from '@/generated/prisma/client.js'

type ErrorDetail = { field: string; message: string }

function sendError(
    reply: FastifyReply,
    statusCode: number,
    code: string,
    message: string,
    details?: ErrorDetail[],
) {
    return reply.status(statusCode).send({ statusCode, code, message, details })
}

export function errorHandler(error: FastifyError, request: FastifyRequest, reply: FastifyReply) {
    if (error instanceof AppError) {
        return sendError(reply, error.statusCode, error.code, error.message)
    }

    if (hasZodFastifySchemaValidationErrors(error)) {
        const details = error.validation.map((issue) => ({
            field: issue.instancePath,
            message: issue.message ?? 'Invalid value',
        }))
        return sendError(reply, 400, 'VALIDATION_ERROR', 'Invalid request data', details)
    }

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
        switch (error.code) {
            case 'P2002':
                return sendError(reply, 409, 'CONFLICT', 'Resource already exists')
            case 'P2025':
                return sendError(reply, 404, 'NOT_FOUND', 'Resource not found')
        }
    }

    request.log.error(error)
    return sendError(reply, 500, 'INTERNAL_SERVER_ERROR', 'Internal server error')
}
