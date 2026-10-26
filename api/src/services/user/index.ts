import { ConflictError, NotFoundError } from '@/errors/index.js'
import { UpdateUserInput } from '@/http/schemas/user/index.js'
import { prisma } from '@/lib/prisma.js'
import { createHash } from 'node:crypto'

export async function getProfileService(userId: string) {
    const user = await prisma.user.findUnique({
        where: {
            publicId: userId,
        },
        select: {
            publicId: true,
            userName: true,
            email: true,
            avatarUrl: true,
            role: true,
            status: true,
            createdAt: true,
        },
    })

    if (!user) {
        throw new NotFoundError('User not found')
    }

    return {
        id: user.publicId,
        userName: user.userName,
        email: user.email,
        avatarUrl: user.avatarUrl,
        role: user.role,
        status: user.status,
        createdAt: user.createdAt,
    }
}

export async function updateUserService(userId: string, data: UpdateUserInput) {
    const user = await prisma.user.findUnique({
        where: { publicId: userId },
    })

    if (!user) {
        throw new NotFoundError('User not found')
    }

    const updateData: {
        userName?: string
        userNameLower?: string
        email?: string
        avatarUrl?: string | null
    } = {}

    if (data.userName && data.userName !== user.userName) {
        const userNameLower = data.userName.trim().toLowerCase()
        const existing = await prisma.user.findFirst({
            where: {
                userNameLower,
                NOT: { id: user.id },
            },
        })

        if (existing) {
            throw new ConflictError('Username already in use')
        }

        updateData.userName = data.userName
        updateData.userNameLower = userNameLower
    }

    if (data.email && data.email.toLowerCase() !== user.email.toLowerCase()) {
        const email = data.email.trim().toLowerCase()
        const existing = await prisma.user.findFirst({
            where: {
                email,
                NOT: { id: user.id },
            },
        })

        if (existing) {
            throw new ConflictError('Email already in use')
        }

        updateData.email = email
    }

    if (data.avatarUrl !== undefined) {
        updateData.avatarUrl = data.avatarUrl
    }

    const updatedUser = await prisma.user.update({
        where: { id: user.id },
        data: updateData,
        select: {
            publicId: true,
            userName: true,
            email: true,
            avatarUrl: true,
            role: true,
            status: true,
            createdAt: true,
        },
    })

    return {
        id: updatedUser.publicId,
        userName: updatedUser.userName,
        email: updatedUser.email,
        avatarUrl: updatedUser.avatarUrl,
        role: updatedUser.role,
        status: updatedUser.status,
        createdAt: updatedUser.createdAt,
    }
}
export async function deleteUserService(userId: string) {
    const user = await prisma.user.findUnique({
        where: { publicId: userId },
        select: { id: true },
    })

    if (!user) {
        throw new NotFoundError('User not found')
    }

    await prisma.$transaction([
        prisma.session.deleteMany({ where: { userId: user.id } }),
        prisma.user.delete({ where: { id: user.id } }),
    ])
}
