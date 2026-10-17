import { env } from '@/config/env.js'
import { LoginInput, RegisterInput } from '@/http/schemas/auth/index.js'
import { createSessionService, loginService, registerService } from '@/services/auth/index.js'
import { randomUUID } from 'node:crypto'
import { FastifyReply, FastifyRequest } from 'fastify'

export async function registerController(
    request: FastifyRequest<{ Body: RegisterInput }>,
    reply: FastifyReply,
) {
    const data = request.body

    const user = await registerService(data)

    const accessToken = await reply.jwtSign(
        {
            sub: user.publicId,
            userName: user.userName,
        },
        {
            expiresIn: env.JWT_EXPIRES_IN_SECONDS,
        },
    )

    const refreshToken = await reply.jwtSign(
        {
            sub: user.publicId,
            userName: user.userName,
        },
        {
            expiresIn: env.JWT_REFRESH_EXPIRES_IN_SECONDS,
            jti: randomUUID(),
        },
    )

    await createSessionService({
        userId: user.id,
        refreshToken,
        userAgent: request.headers['user-agent'],
        ip: request.ip,
    })

    return reply
        .setCookie('access_token', accessToken, {
            path: '/',
            httpOnly: true,
            secure: env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: env.JWT_EXPIRES_IN_SECONDS,
        })
        .setCookie('refresh_token', refreshToken, {
            path: '/api/v1/auth',
            httpOnly: true,
            secure: env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: env.JWT_REFRESH_EXPIRES_IN_SECONDS,
        })
        .status(201)
        .send({
            user: {
                id: user.publicId,
                userName: user.userName,
            },
        })
}

export async function loginController(
    request: FastifyRequest<{ Body: LoginInput }>,
    reply: FastifyReply,
) {
    const data = request.body

    const user = await loginService(data)

    const accessToken = await reply.jwtSign(
        {
            sub: user.publicId,
            userName: user.userName,
        },
        { expiresIn: env.JWT_EXPIRES_IN_SECONDS },
    )

    const refreshToken = await reply.jwtSign(
        {
            sub: user.publicId,
            userName: user.userName,
        },
        {
            expiresIn: env.JWT_REFRESH_EXPIRES_IN_SECONDS,
            jti: randomUUID(),
        },
    )

    await createSessionService({
        userId: user.id,
        refreshToken,
        userAgent: request.headers['user-agent'],
        ip: request.ip,
    })

    return reply
        .setCookie('access_token', accessToken, {
            path: '/',
            httpOnly: true,
            secure: env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: env.JWT_EXPIRES_IN_SECONDS,
        })
        .setCookie('refresh_token', refreshToken, {
            path: '/api/v1/auth',
            httpOnly: true,
            secure: env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: env.JWT_REFRESH_EXPIRES_IN_SECONDS,
        })
        .status(200)
        .send({
            user: {
                id: user.publicId,
                userName: user.userName,
            },
        })
}
