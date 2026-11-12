import { describe, expect, it, vi, beforeEach } from 'vitest'
import { createTableService, listTablesService } from '../src/services/table/index.js'
import { prisma } from '../src/lib/prisma.js'

vi.mock('../src/lib/prisma.js', () => ({
    prisma: {
        table: {
            create: vi.fn(),
            count: vi.fn(),
            findMany: vi.fn(),
        },
        $transaction: vi.fn(),
    },
}))

describe('Table Service', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    describe('createTableService', () => {
        it('should create a table successfully with valid config and custom rake', async () => {
            const tableData = {
                name: 'NLH 10/20 Micro',
                currency: 'PLAY' as const,
                config: {
                    smallBlind: 10,
                    bigBlind: 20,
                    minBuyIn: 400,
                    maxBuyIn: 2000,
                    maxPlayers: 6,
                    ante: 0,
                    rakePercent: 5,
                    rakeCap: 300,
                    noFlopNoDrop: true,
                    timeBankSeconds: 30,
                    timeBankDeductionSeconds: 5,
                    actionTimeoutSeconds: 15,
                    allowSpectators: true,
                },
            }

            const createdAt = new Date('2026-11-12T18:00:00Z')
            const updatedAt = new Date('2026-11-12T18:00:00Z')

            vi.mocked(prisma.table.create).mockResolvedValueOnce({
                id: 1,
                publicId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
                name: tableData.name,
                currency: 'PLAY',
                status: 'WAITING',
                config: tableData.config,
                createdAt,
                updatedAt,
            } as any)

            const result = await createTableService(tableData)

            expect(result).toEqual({
                id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
                name: 'NLH 10/20 Micro',
                status: 'WAITING',
                currency: 'PLAY',
                config: tableData.config,
                createdAt,
                updatedAt,
            })

            expect(prisma.table.create).toHaveBeenCalledWith({
                data: {
                    name: 'NLH 10/20 Micro',
                    currency: 'PLAY',
                    status: 'WAITING',
                    config: tableData.config,
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
        })

        it('should throw if engine config is rejected by PokerEngine', async () => {
            const invalidConfig = {
                name: 'Invalid Table',
                currency: 'PLAY' as const,
                config: {
                    smallBlind: 20,
                    bigBlind: 10, // Invalid: smallBlind >= bigBlind
                    minBuyIn: 400,
                    maxBuyIn: 2000,
                    maxPlayers: 6,
                },
            }

            await expect(createTableService(invalidConfig as any)).rejects.toThrow()
            expect(prisma.table.create).not.toHaveBeenCalled()
        })
    })

    describe('listTablesService', () => {
        it('should return paginated list of tables with filters', async () => {
            const createdAt = new Date('2026-11-12T18:00:00Z')
            const updatedAt = new Date('2026-11-12T18:00:00Z')

            const mockTables = [
                {
                    publicId: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
                    name: 'Table 1',
                    status: 'WAITING',
                    currency: 'PLAY',
                    config: {
                        smallBlind: 10,
                        bigBlind: 20,
                        minBuyIn: 400,
                        maxBuyIn: 2000,
                        maxPlayers: 6,
                    },
                    createdAt,
                    updatedAt,
                },
            ]

            vi.mocked(prisma.$transaction).mockResolvedValueOnce([1, mockTables] as any)

            const result = await listTablesService({
                page: 1,
                limit: 10,
                status: 'WAITING',
                currency: 'PLAY',
            })

            expect(result).toEqual({
                tables: [
                    {
                        id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
                        name: 'Table 1',
                        status: 'WAITING',
                        currency: 'PLAY',
                        config: {
                            smallBlind: 10,
                            bigBlind: 20,
                            minBuyIn: 400,
                            maxBuyIn: 2000,
                            maxPlayers: 6,
                        },
                        createdAt,
                        updatedAt,
                    },
                ],
                pagination: {
                    page: 1,
                    limit: 10,
                    total: 1,
                    totalPages: 1,
                },
            })
        })
    })
})
