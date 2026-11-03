import { FREE_CHIPS_COOLDOWN_MS, FREE_CHIPS_AMOUNT } from '@/config/wallet.js'
import { HOUSE_EMAIL } from '@/config/system.js'
import { randomUUID } from 'node:crypto'
import { ConflictError, ForbiddenError, NotFoundError } from '@/errors/index.js'
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
            orderBy: { createdAt: 'desc' },
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

export async function claimFreeChipsService(userId: string) {
    const now = new Date()
    const nextClaimAt = new Date(now.getTime() + FREE_CHIPS_COOLDOWN_MS)
    const claimTxId = randomUUID()

    return await prisma.$transaction(async (tx) => {
        const { count } = await tx.user.updateMany({
            where: {
                publicId: userId,
                status: 'ACTIVE',
                OR: [{ freeChipsNextClaimAt: null }, { freeChipsNextClaimAt: { lte: now } }],
            },
            data: {
                freeChipsLastClaimAt: now,
                freeChipsNextClaimAt: nextClaimAt,
            },
        })

        if (count === 0) {
            const user = await tx.user.findUnique({ where: { publicId: userId } })

            if (!user) {
                throw new NotFoundError('User not found')
            }

            if (user.status !== 'ACTIVE') {
                throw new ForbiddenError('Account is not active')
            }

            throw new ConflictError(
                `Free chips available again at ${user.freeChipsNextClaimAt?.toISOString()}`,
            )
        }

        const user = await tx.user.findUnique({
            where: { publicId: userId },
            select: { id: true },
        })

        if (!user) {
            throw new NotFoundError('User not found')
        }

        const userAccount = await tx.account.findUnique({
            where: {
                userId_type_currency: {
                    userId: user.id,
                    type: 'MAIN',
                    currency: 'PLAY',
                },
            },
        })

        if (!userAccount) {
            throw new NotFoundError('Player account not found')
        }

        const houseReserve = await tx.account.findFirst({
            where: {
                type: 'HOUSE_RESERVE',
                currency: 'PLAY',
                user: { email: HOUSE_EMAIL },
            },
        })

        if (!houseReserve) {
            throw new NotFoundError('House reserve account not found')
        }

        await tx.account.update({
            where: { id: houseReserve.id },
            data: { balance: { decrement: FREE_CHIPS_AMOUNT } },
        })

        const updatedAccount = await tx.account.update({
            where: { id: userAccount.id },
            data: { balance: { increment: FREE_CHIPS_AMOUNT } },
        })

        await tx.ledgerEntry.createMany({
            data: [
                {
                    accountId: houseReserve.id,
                    transactionId: claimTxId,
                    amount: -FREE_CHIPS_AMOUNT,
                    type: 'FREE_CLAIM',
                    referenceId: 'FREE_CHIPS_REFILL',
                },
                {
                    accountId: userAccount.id,
                    transactionId: claimTxId,
                    amount: FREE_CHIPS_AMOUNT,
                    type: 'FREE_CLAIM',
                    referenceId: 'FREE_CHIPS_REFILL',
                },
            ],
        })

        return {
            amount: FREE_CHIPS_AMOUNT,
            balance: updatedAccount.balance,
            nextClaimAt,
        }
    })
}
