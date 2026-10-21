import { env } from '@/config/env.js'
import { LoginInput, RegisterInput } from '@/http/schemas/auth/index.js'
import {
    createSessionService,
    loginService,
    logoutService,
    refreshTokenService,
    registerService,
} from '@/services/auth/index.js'
import { randomUUID } from 'node:crypto'
import { FastifyReply, FastifyRequest } from 'fastify'
import { UnauthorizedError } from '@/errors/index.js'

export async function registerController(
    request: FastifyRequest<{ Body: RegisterInput }>,
    reply: FastifyReply,
) {
    const data = request.body

    const user = await registerService(data)

    const accessToken = await reply.jwtSign(
        {
            sub: user.publicId,
            role: user.role,
            userName: user.userName,
            type: 'access',
        },
        {
            expiresIn: env.JWT_EXPIRES_IN_SECONDS,
        },
    )

    const refreshToken = await reply.jwtSign(
        {
            sub: user.publicId,
            role: user.role,
            userName: user.userName,
            type: 'refresh',
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
            role: user.role,
            userName: user.userName,
            type: 'access',
        },
        { expiresIn: env.JWT_EXPIRES_IN_SECONDS },
    )

    const refreshToken = await reply.jwtSign(
        {
            sub: user.publicId,
            role: user.role,
            userName: user.userName,
            type: 'refresh',
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

export async function logoutController(request: FastifyRequest, reply: FastifyReply) {
    const refreshToken = request.cookies.refresh_token

    await logoutService(refreshToken)

    return reply
        .clearCookie('access_token', { path: '/' })
        .clearCookie('refresh_token', { path: '/api/v1/auth' })
        .status(204)
        .send()
}

export async function refreshTokenController(request: FastifyRequest, reply: FastifyReply) {
    const oldRefreshToken = request.cookies.refresh_token

    if (!oldRefreshToken) {
        throw new UnauthorizedError('Invalid refresh token')
    }

    let payload

    try {
        payload = request.server.jwt.verify<{ type: string }>(oldRefreshToken)
    } catch {
        throw new UnauthorizedError('Invalid refresh token')
    }

    if (payload.type !== 'refresh') {
        throw new UnauthorizedError('Invalid refresh token')
    }

    const user = await refreshTokenService(oldRefreshToken)

    const accessToken = await reply.jwtSign(
        {
            sub: user.publicId,
            role: user.role,
            userName: user.userName,
            type: 'access',
        },
        { expiresIn: env.JWT_EXPIRES_IN_SECONDS },
    )

    const refreshToken = await reply.jwtSign(
        {
            sub: user.publicId,
            role: user.role,
            userName: user.userName,
            type: 'refresh',
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
