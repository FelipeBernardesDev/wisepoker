import { NotFoundError } from '@/errors/index.js'
import { prisma } from '@/lib/prisma.js'

export async function getWalletService(userId: string) {
    const user = await prisma.user.findUnique({
        where: { publicId: userId },
        select: { id: true },
    })

    if (!user) {
        throw new NotFoundError('User not found')
    }

    const accounts = await prisma.account.findMany({
        where: { userId: user.id },
        select: {
            publicId: true,
            type: true,
            currency: true,
            balance: true,
            createdAt: true,
        },
        orderBy: { createdAt: 'asc' },
    })

    return {
        accounts: accounts.map((account) => ({
            id: account.publicId,
            type: account.type,
            currency: account.currency,
            balance: Number(account.balance),
            createdAt: account.createdAt,
        })),
    }
}
