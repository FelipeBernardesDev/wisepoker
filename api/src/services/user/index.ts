import { NotFoundError } from '@/errors/index.js'
import { prisma } from '@/lib/prisma.js'

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
