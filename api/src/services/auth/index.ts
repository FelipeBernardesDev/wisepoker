import { ConflictError, UnauthorizedError } from '@/errors/index.js'
import { LoginInput, RegisterInput } from '@/http/schemas/auth/index.js'
import { comparePassword, hashPassword } from '@/lib/password.js'
import { prisma } from '@/lib/prisma.js'
import { createHash } from 'node:crypto'
import { env } from '@/config/env.js'

type CreateSessionInput = {
    userId: number
    refreshToken: string
    userAgent?: string
    ip?: string
}

export async function createSessionService(data: CreateSessionInput) {
    const refreshTokenHash = createHash('sha256').update(data.refreshToken).digest('hex')

    const expiresAt = new Date(Date.now() + env.JWT_REFRESH_EXPIRES_IN_SECONDS * 1000)

    await prisma.session.create({
        data: {
            userId: data.userId,
            refreshTokenHash,
            expiresAt,
            userAgent: data.userAgent,
            ip: data.ip,
        },
    })
}

export async function registerService(data: RegisterInput) {
    const email = data.email.trim().toLowerCase()
    const userNameLower = data.userName.trim().toLowerCase()

    const userAlreadyExist = await prisma.user.findFirst({
        where: {
            OR: [{ email }, { userNameLower }],
        },
    })

    if (userAlreadyExist) {
        throw new ConflictError('Email or username already in use')
    }

    const passwordHash = await hashPassword(data.password)

    const user = await prisma.user.create({
        data: {
            userName: data.userName,
            userNameLower,
            email,
            passwordHash,
        },
        select: {
            id: true,
            publicId: true,
            userName: true,
            userNameLower: true,
        },
    })

    return user
}

export async function loginService(data: LoginInput) {
    const identifier = data.identifier.trim().toLowerCase()

    const user = await prisma.user.findFirst({
        where: {
            OR: [{ email: identifier }, { userNameLower: identifier }],
        },
    })

    if (!user) {
        throw new UnauthorizedError('Invalid credentials')
    }

    const passwordMatch = await comparePassword(data.password, user.passwordHash)

    if (!passwordMatch) {
        throw new UnauthorizedError('Invalid credentials')
    }

    return {
        id: user.id,
        publicId: user.publicId,
        userName: user.userName,
        userNameLower: user.userNameLower,
    }
}

export async function logoutService(refreshToken: string | undefined) {
    if (!refreshToken) return

    const refreshTokenHash = createHash('sha256').update(refreshToken).digest('hex')

    await prisma.session.deleteMany({
        where: {
            refreshTokenHash,
        },
    })
}
