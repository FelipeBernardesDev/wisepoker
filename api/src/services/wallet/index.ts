import { NotFoundError } from '@/errors/index.js'
import { GetLedgerQuery } from '@/http/schemas/wallet/index.js'
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

export async function getWalletLedgerService(userId: string, query: GetLedgerQuery) {
    const user = await prisma.user.findUnique({
        where: { publicId: userId },
        select: { id: true },
    })

    if (!user) {
        throw new NotFoundError('User not found')
    }

    const { page, limit, type } = query

    const where = {
        account: {
            userId: user.id,
        },
        ...(type ? { type } : {}),
    }

    const [total, entries] = await prisma.$transaction([
        prisma.ledgerEntry.count({ where }),
        prisma.ledgerEntry.findMany({
            where,
            take: limit,
            skip: (page - 1) * limit,
            orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
            select: {
                publicId: true,
                amount: true,
                type: true,
                referenceId: true,
                createdAt: true,
                account: {
                    select: {
                        publicId: true,
                        type: true,
                        currency: true,
                    },
                },
            },
        }),
    ])

    return {
        entries: entries.map((entry) => ({
            id: entry.publicId,
            amount: Number(entry.amount),
            type: entry.type,
            referenceId: entry.referenceId,
            account: {
                id: entry.account.publicId,
                type: entry.account.type,
                currency: entry.account.currency,
            },
            createdAt: entry.createdAt,
        })),
        pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
        },
    }
}
