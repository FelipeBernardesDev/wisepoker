import { NotFoundError } from '@/errors/index.js'
import { CreateTableInput, ListTablesQuery } from '@/http/schemas/table/index.js'
import { prisma } from '@/lib/prisma.js'
import { PokerEngine } from '@pokertools/engine'

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
