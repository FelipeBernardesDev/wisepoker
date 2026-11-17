import { BadRequestError, InsufficientFundsError, NotFoundError } from '@/errors/index.js'
import { CreateTableInput, ListTablesQuery, TableConfig } from '@/http/schemas/table/index.js'
import { prisma } from '@/lib/prisma.js'
import { PokerEngine } from '@pokertools/engine'
import { randomUUID } from 'node:crypto'

export async function createTableService(data: CreateTableInput) {
    const { name, currency, config } = data

    // Valida a configuração contra a engine do @pokertools/engine
    new PokerEngine({
        smallBlind: config.smallBlind,
        bigBlind: config.bigBlind,
        maxPlayers: config.maxPlayers,
        ante: config.ante,
        rakePercent: config.rakePercent,
        rakeCap: config.rakeCap,
        timeBankSeconds: config.timeBankSeconds,
        timeBankDeductionSeconds: config.timeBankDeductionSeconds,
    })

    const table = await prisma.table.create({
        data: {
            name,
            currency,
            status: 'WAITING',
            config,
        },
        select: {
            publicId: true,
            name: true,
            status: true,
            currency: true,
            config: true,
            createdAt: true,
            updatedAt: true,
        },
    })

    return {
        id: table.publicId,
        name: table.name,
        status: table.status,
        currency: table.currency,
        config: table.config as CreateTableInput['config'],
        createdAt: table.createdAt,
        updatedAt: table.updatedAt,
    }
}

export async function getTableService(id: string) {
    const table = await prisma.table.findUnique({
        where: { publicId: id },
        select: {
            publicId: true,
            name: true,
            status: true,
            currency: true,
            config: true,
            createdAt: true,
            updatedAt: true,
        },
    })

    if (!table) {
        throw new NotFoundError('Table not found')
    }

    return {
        id: table.publicId,
        name: table.name,
        status: table.status,
        currency: table.currency,
        config: table.config as CreateTableInput['config'],
        createdAt: table.createdAt,
        updatedAt: table.updatedAt,
    }
}

export async function listTablesService(query: ListTablesQuery) {
    const { page, limit, status, currency } = query

    const where = {
        ...(status ? { status } : {}),
        ...(currency ? { currency } : {}),
    }

    const [total, tables] = await prisma.$transaction([
        prisma.table.count({ where }),
        prisma.table.findMany({
            where,
            take: limit,
            skip: (page - 1) * limit,
            orderBy: { createdAt: 'desc' },
            select: {
                publicId: true,
                name: true,
                status: true,
                currency: true,
                config: true,
                createdAt: true,
                updatedAt: true,
            },
        }),
    ])

    return {
        tables: tables.map((table) => ({
            id: table.publicId,
            name: table.name,
            status: table.status,
            currency: table.currency,
            config: table.config as CreateTableInput['config'],
            createdAt: table.createdAt,
            updatedAt: table.updatedAt,
        })),
        pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
        },
    }
}

export interface BuyInInput {
    tableId: string
    userId: string
    amount: number
}

export async function buyInService({ tableId, userId, amount }: BuyInInput) {
    const table = await prisma.table.findUnique({
        where: { publicId: tableId },
        select: {
            publicId: true,
            status: true,
            currency: true,
            config: true,
        },
    })

    if (!table) {
        throw new NotFoundError('Table not found')
    }

    if (table.status === 'CLOSED') {
        throw new BadRequestError('Table is closed')
    }

    const config = table.config as unknown as TableConfig

    if (amount < config.minBuyIn || amount > config.maxBuyIn) {
        throw new BadRequestError(
            `Buy-in amount must be between ${config.minBuyIn} and ${config.maxBuyIn}`,
        )
    }

    return await prisma.$transaction(async (tx) => {
        const user = await tx.user.findUnique({
            where: { publicId: userId },
            select: { id: true },
        })

        if (!user) {
            throw new NotFoundError('User not found')
        }

        const mainAccount = await tx.account.findUnique({
            where: {
                userId_type_currency: {
                    userId: user.id,
                    type: 'MAIN',
                    currency: table.currency,
                },
            },
        })

        if (!mainAccount) {
            throw new NotFoundError('Main account not found')
        }

        const amountBigInt = BigInt(amount)

        if (mainAccount.balance < amountBigInt) {
            throw new InsufficientFundsError('Insufficient funds for buy-in')
        }

        const inPlayAccount = await tx.account.findUnique({
            where: {
                userId_type_currency: {
                    userId: user.id,
                    type: 'IN_PLAY',
                    currency: table.currency,
                },
            },
        })

        if (!inPlayAccount) {
            throw new NotFoundError('In-play account not found')
        }

        const updatedMainAccount = await tx.account.update({
            where: { id: mainAccount.id },
            data: { balance: { decrement: amountBigInt } },
        })

        const updatedInPlayAccount = await tx.account.update({
            where: { id: inPlayAccount.id },
            data: { balance: { increment: amountBigInt } },
        })

        const transactionId = randomUUID()

        await tx.ledgerEntry.createMany({
            data: [
                {
                    accountId: mainAccount.id,
                    transactionId,
                    amount: -amountBigInt,
                    type: 'BUY_IN',
                    referenceId: table.publicId,
                },
                {
                    accountId: inPlayAccount.id,
                    transactionId,
                    amount: amountBigInt,
                    type: 'BUY_IN',
                    referenceId: table.publicId,
                },
            ],
        })

        return {
            transactionId,
            tableId: table.publicId,
            amount: amountBigInt,
            currency: table.currency,
            mainBalance: updatedMainAccount.balance,
            inPlayBalance: updatedInPlayAccount.balance,
        }
    })
}
