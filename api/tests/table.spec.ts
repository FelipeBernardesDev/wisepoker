import { describe, expect, it, vi, beforeEach } from 'vitest'
import {
    buyInService,
    createTableService,
    getTableService,
    getTableStateService,
    leaveTableService,
    listTablesService,
} from '../src/services/table/index.js'
import { tableWebSocketHandler } from '../src/http/controllers/table/index.js'
import { prisma } from '../src/lib/prisma.js'
import {
    BadRequestError,
    ConflictError,
    InsufficientFundsError,
    NotFoundError,
} from '../src/errors/index.js'
import { tableManager } from '../src/game/table-manager.js'

vi.mock('../src/lib/prisma.js', () => ({
    prisma: {
        user: {
            findUnique: vi.fn(),
        },
        account: {
            findUnique: vi.fn(),
            update: vi.fn(),
        },
        ledgerEntry: {
            createMany: vi.fn(),
        },
        table: {
            create: vi.fn(),
            findUnique: vi.fn(),
            count: vi.fn(),
            findMany: vi.fn(),
        },
        $transaction: vi.fn(),
    },
}))

describe('Table Service', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        tableManager.clear()
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

    describe('getTableService', () => {
        it('should throw NotFoundError if table does not exist', async () => {
            vi.mocked(prisma.table.findUnique).mockResolvedValueOnce(null)

            await expect(getTableService('non-existent-id')).rejects.toThrow(NotFoundError)
        })

        it('should return table details if found', async () => {
            const createdAt = new Date('2026-11-12T18:00:00Z')
            const updatedAt = new Date('2026-11-12T18:00:00Z')

            vi.mocked(prisma.table.findUnique).mockResolvedValueOnce({
                id: 1,
                publicId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
                name: 'NLH 10/20 Micro',
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
            } as any)

            const result = await getTableService('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa')

            expect(result).toEqual({
                id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
                name: 'NLH 10/20 Micro',
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
            })

            expect(prisma.table.findUnique).toHaveBeenCalledWith({
                where: { publicId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa' },
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

    describe('buyInService', () => {
        const tableId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
        const userId = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'

        const baseTable = {
            id: 1,
            publicId: tableId,
            name: 'NLH 10/20 Micro',
            status: 'WAITING',
            currency: 'PLAY',
            config: {
                smallBlind: 10,
                bigBlind: 20,
                minBuyIn: 400,
                maxBuyIn: 2000,
                maxPlayers: 6,
            },
        }

        it('should throw NotFoundError if table does not exist', async () => {
            vi.mocked(prisma.table.findUnique).mockResolvedValueOnce(null)

            await expect(buyInService({ tableId, userId, amount: 500 })).rejects.toThrow(
                NotFoundError,
            )
        })

        it('should throw BadRequestError if table is CLOSED', async () => {
            vi.mocked(prisma.table.findUnique).mockResolvedValueOnce({
                ...baseTable,
                status: 'CLOSED',
            } as any)

            await expect(buyInService({ tableId, userId, amount: 500 })).rejects.toThrow(
                new BadRequestError('Table is closed'),
            )
        })

        it('should throw BadRequestError if amount is less than minBuyIn', async () => {
            vi.mocked(prisma.table.findUnique).mockResolvedValueOnce(baseTable as any)

            await expect(buyInService({ tableId, userId, amount: 300 })).rejects.toThrow(
                new BadRequestError('Buy-in amount must be between 400 and 2000'),
            )
        })

        it('should throw BadRequestError if amount is greater than maxBuyIn', async () => {
            vi.mocked(prisma.table.findUnique).mockResolvedValueOnce(baseTable as any)

            await expect(buyInService({ tableId, userId, amount: 2500 })).rejects.toThrow(
                new BadRequestError('Buy-in amount must be between 400 and 2000'),
            )
        })

        it('should throw NotFoundError if user does not exist in transaction', async () => {
            vi.mocked(prisma.table.findUnique).mockResolvedValueOnce(baseTable as any)

            const mockTx = {
                user: {
                    findUnique: vi.fn().mockResolvedValueOnce(null),
                },
            }
            vi.mocked(prisma.$transaction).mockImplementationOnce(async (fn: any) => fn(mockTx))

            await expect(buyInService({ tableId, userId, amount: 1000 })).rejects.toThrow(
                new NotFoundError('User not found'),
            )
        })

        it('should throw NotFoundError if MAIN account does not exist', async () => {
            vi.mocked(prisma.table.findUnique).mockResolvedValueOnce(baseTable as any)

            const mockTx = {
                user: {
                    findUnique: vi.fn().mockResolvedValueOnce({ id: 1 }),
                },
                account: {
                    findUnique: vi.fn().mockResolvedValueOnce(null),
                },
            }
            vi.mocked(prisma.$transaction).mockImplementationOnce(async (fn: any) => fn(mockTx))

            await expect(buyInService({ tableId, userId, amount: 1000 })).rejects.toThrow(
                new NotFoundError('Main account not found'),
            )
        })

        it('should throw InsufficientFundsError if MAIN account has insufficient balance', async () => {
            vi.mocked(prisma.table.findUnique).mockResolvedValueOnce(baseTable as any)

            const mockTx = {
                user: {
                    findUnique: vi.fn().mockResolvedValueOnce({ id: 1 }),
                },
                account: {
                    findUnique: vi.fn().mockResolvedValueOnce({
                        id: 10,
                        balance: 500n,
                    }),
                },
            }
            vi.mocked(prisma.$transaction).mockImplementationOnce(async (fn: any) => fn(mockTx))

            await expect(buyInService({ tableId, userId, amount: 1000 })).rejects.toThrow(
                new InsufficientFundsError('Insufficient funds for buy-in'),
            )
        })

        it('should throw NotFoundError if IN_PLAY account does not exist', async () => {
            vi.mocked(prisma.table.findUnique).mockResolvedValueOnce(baseTable as any)

            const mockTx = {
                user: {
                    findUnique: vi.fn().mockResolvedValueOnce({ id: 1 }),
                },
                account: {
                    findUnique: vi
                        .fn()
                        .mockResolvedValueOnce({ id: 10, balance: 2000n }) // MAIN
                        .mockResolvedValueOnce(null), // IN_PLAY
                },
            }
            vi.mocked(prisma.$transaction).mockImplementationOnce(async (fn: any) => fn(mockTx))

            await expect(buyInService({ tableId, userId, amount: 1000 })).rejects.toThrow(
                new NotFoundError('In-play account not found'),
            )
        })

        it('should successfully buy-in: decrement MAIN, increment IN_PLAY, and create 2 balanced ledger entries', async () => {
            vi.mocked(prisma.table.findUnique).mockResolvedValueOnce(baseTable as any)

            const mockTx = {
                user: {
                    findUnique: vi.fn().mockResolvedValueOnce({ id: 1, userName: 'player1' }),
                },
                account: {
                    findUnique: vi
                        .fn()
                        .mockResolvedValueOnce({ id: 10, balance: 5000n }) // MAIN
                        .mockResolvedValueOnce({ id: 20, balance: 0n }), // IN_PLAY
                    update: vi.fn().mockImplementation(({ where, data }) => {
                        if (where.id === 10) {
                            return Promise.resolve({ id: 10, balance: 4000n })
                        }
                        if (where.id === 20) {
                            return Promise.resolve({ id: 20, balance: 1000n })
                        }
                    }),
                },
                ledgerEntry: {
                    createMany: vi.fn().mockResolvedValueOnce({ count: 2 }),
                },
            }
            vi.mocked(prisma.$transaction).mockImplementationOnce(async (fn: any) => fn(mockTx))

            const result = await buyInService({ tableId, userId, amount: 1000 })

            expect(result.tableId).toBe(tableId)
            expect(result.seat).toBe(0) // Primeiro assento livre
            expect(result.amount).toBe(1000n)
            expect(result.currency).toBe('PLAY')
            expect(result.mainBalance).toBe(4000n)
            expect(result.inPlayBalance).toBe(1000n)
            expect(result.transactionId).toBeDefined()

            // Verify account updates
            expect(mockTx.account.update).toHaveBeenCalledWith({
                where: { id: 10 },
                data: { balance: { decrement: 1000n } },
            })
            expect(mockTx.account.update).toHaveBeenCalledWith({
                where: { id: 20 },
                data: { balance: { increment: 1000n } },
            })

            // Verify player was seated in engine
            expect(tableManager.isPlayerSeated(tableId, userId)).toBe(true)
            const seatedPlayer = tableManager.getSeatedPlayer(tableId, userId)
            expect(seatedPlayer?.seat).toBe(0)
            expect(seatedPlayer?.stack).toBe(1000)

            // Verify ledger entries
            expect(mockTx.ledgerEntry.createMany).toHaveBeenCalledWith({
                data: [
                    {
                        accountId: 10,
                        transactionId: result.transactionId,
                        amount: -1000n,
                        type: 'BUY_IN',
                        referenceId: tableId,
                    },
                    {
                        accountId: 20,
                        transactionId: result.transactionId,
                        amount: 1000n,
                        type: 'BUY_IN',
                        referenceId: tableId,
                    },
                ],
            })

            // Verify double-entry sum is 0
            const entries = mockTx.ledgerEntry.createMany.mock.calls[0][0].data
            expect(entries[0].amount + entries[1].amount).toBe(0n)
            expect(entries[0].transactionId).toBe(entries[1].transactionId)
            expect(entries[0].type).toBe('BUY_IN')
            expect(entries[1].type).toBe('BUY_IN')
            expect(entries[0].referenceId).toBe(tableId)
            expect(entries[1].referenceId).toBe(tableId)
        })

        it('should throw BadRequestError if seat is out of table bounds', async () => {
            vi.mocked(prisma.table.findUnique).mockResolvedValueOnce(baseTable as any)

            await expect(buyInService({ tableId, userId, amount: 1000, seat: 6 })).rejects.toThrow(
                new BadRequestError('Seat must be between 0 and 5'),
            )
        })

        it('should allow player to sit at a specific valid seat', async () => {
            vi.mocked(prisma.table.findUnique).mockResolvedValueOnce(baseTable as any)

            const mockTx = {
                user: {
                    findUnique: vi.fn().mockResolvedValueOnce({ id: 1, userName: 'player1' }),
                },
                account: {
                    findUnique: vi
                        .fn()
                        .mockResolvedValueOnce({ id: 10, balance: 5000n })
                        .mockResolvedValueOnce({ id: 20, balance: 0n }),
                    update: vi.fn().mockResolvedValue({ id: 10, balance: 4000n }),
                },
                ledgerEntry: {
                    createMany: vi.fn().mockResolvedValueOnce({ count: 2 }),
                },
            }
            vi.mocked(prisma.$transaction).mockImplementationOnce(async (fn: any) => fn(mockTx))

            const result = await buyInService({ tableId, userId, amount: 1000, seat: 3 })

            expect(result.seat).toBe(3)
            expect(tableManager.getSeatedPlayer(tableId, userId)?.seat).toBe(3)
        })

        it('should throw ConflictError if seat is already occupied', async () => {
            tableManager.sitPlayer(
                tableId,
                0,
                { id: 'another-user', name: 'Other' },
                1000,
                baseTable.config as any,
            )

            vi.mocked(prisma.table.findUnique).mockResolvedValueOnce(baseTable as any)

            await expect(buyInService({ tableId, userId, amount: 1000, seat: 0 })).rejects.toThrow(
                new ConflictError('Seat 0 is already occupied'),
            )
        })

        it('should throw ConflictError if player is already seated at the table', async () => {
            tableManager.sitPlayer(
                tableId,
                0,
                { id: userId, name: 'Player1' },
                1000,
                baseTable.config as any,
            )

            vi.mocked(prisma.table.findUnique).mockResolvedValueOnce(baseTable as any)

            await expect(buyInService({ tableId, userId, amount: 1000 })).rejects.toThrow(
                new ConflictError('Player is already seated at this table'),
            )
        })
    })

    describe('leaveTableService', () => {
        const tableId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
        const userId = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'

        const baseTable = {
            id: 1,
            publicId: tableId,
            name: 'NLH 10/20 Micro',
            status: 'WAITING',
            currency: 'PLAY',
            config: {
                smallBlind: 10,
                bigBlind: 20,
                minBuyIn: 400,
                maxBuyIn: 2000,
                maxPlayers: 6,
            },
        }

        it('should throw NotFoundError if table does not exist', async () => {
            vi.mocked(prisma.table.findUnique).mockResolvedValueOnce(null)

            await expect(leaveTableService({ tableId, userId })).rejects.toThrow(NotFoundError)
        })

        it('should throw BadRequestError if player is not seated at table', async () => {
            vi.mocked(prisma.table.findUnique).mockResolvedValueOnce(baseTable as any)

            await expect(leaveTableService({ tableId, userId })).rejects.toThrow(
                new BadRequestError('Player is not seated at this table'),
            )
        })

        it('should successfully leave table, stand player in engine, and cash out to MAIN account', async () => {
            // Senta o jogador na engine
            tableManager.sitPlayer(
                tableId,
                2,
                { id: userId, name: 'Player1' },
                1500,
                baseTable.config as any,
            )

            vi.mocked(prisma.table.findUnique).mockResolvedValueOnce(baseTable as any)

            const mockTx = {
                user: {
                    findUnique: vi.fn().mockResolvedValueOnce({ id: 1 }),
                },
                account: {
                    findUnique: vi
                        .fn()
                        .mockResolvedValueOnce({ id: 20, balance: 1500n }) // IN_PLAY
                        .mockResolvedValueOnce({ id: 10, balance: 3000n }), // MAIN
                    update: vi.fn().mockImplementation(({ where, data }) => {
                        if (where.id === 20) {
                            return Promise.resolve({ id: 20, balance: 0n })
                        }
                        if (where.id === 10) {
                            return Promise.resolve({ id: 10, balance: 4500n })
                        }
                    }),
                },
                ledgerEntry: {
                    createMany: vi.fn().mockResolvedValueOnce({ count: 2 }),
                },
            }
            vi.mocked(prisma.$transaction).mockImplementationOnce(async (fn: any) => fn(mockTx))

            const result = await leaveTableService({ tableId, userId })

            expect(result.amount).toBe(1500n)
            expect(result.mainBalance).toBe(4500n)
            expect(result.inPlayBalance).toBe(0n)

            // Player should no longer be seated
            expect(tableManager.isPlayerSeated(tableId, userId)).toBe(false)

            // Verify accounts updated in reverse
            expect(mockTx.account.update).toHaveBeenCalledWith({
                where: { id: 20 },
                data: { balance: { decrement: 1500n } },
            })
            expect(mockTx.account.update).toHaveBeenCalledWith({
                where: { id: 10 },
                data: { balance: { increment: 1500n } },
            })

            // Verify CASH_OUT ledger entries
            expect(mockTx.ledgerEntry.createMany).toHaveBeenCalledWith({
                data: [
                    {
                        accountId: 20,
                        transactionId: result.transactionId,
                        amount: -1500n,
                        type: 'CASH_OUT',
                        referenceId: tableId,
                    },
                    {
                        accountId: 10,
                        transactionId: result.transactionId,
                        amount: 1500n,
                        type: 'CASH_OUT',
                        referenceId: tableId,
                    },
                ],
            })
        })
    })

    describe('getTableStateService', () => {
        const tableId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'

        const baseTable = {
            id: 1,
            publicId: tableId,
            name: 'NLH 10/20 Micro',
            status: 'WAITING',
            currency: 'PLAY',
            config: {
                smallBlind: 10,
                bigBlind: 20,
                minBuyIn: 400,
                maxBuyIn: 2000,
                maxPlayers: 6,
            },
        }

        it('should throw NotFoundError if table does not exist', async () => {
            vi.mocked(prisma.table.findUnique).mockResolvedValueOnce(null)

            await expect(getTableStateService({ tableId })).rejects.toThrow(NotFoundError)
        })

        it('should return table metadata and engine public state', async () => {
            vi.mocked(prisma.table.findUnique).mockResolvedValueOnce(baseTable as any)

            tableManager.sitPlayer(
                tableId,
                0,
                { id: 'player-1', name: 'Alice' },
                1000,
                baseTable.config as any,
            )

            const result = await getTableStateService({ tableId })

            expect(result.table.id).toBe(tableId)
            expect(result.table.name).toBe('NLH 10/20 Micro')
            expect(result.state).toBeDefined()
            expect(result.state.players[0].name).toBe('Alice')
            expect(result.state.players[0].stack).toBe(1000)
            expect(result.state.players[1]).toBeNull()
        })
    })

    describe('tableWebSocketHandler & TableManager Broadcast', () => {
        const tableId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
        const userId = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'

        const baseTable = {
            id: 1,
            publicId: tableId,
            name: 'NLH 10/20 Micro',
            status: 'WAITING',
            currency: 'PLAY',
            config: {
                smallBlind: 10,
                bigBlind: 20,
                minBuyIn: 400,
                maxBuyIn: 2000,
                maxPlayers: 6,
            },
        }

        function createMockSocket() {
            const listeners: Record<string, Function[]> = {}
            return {
                readyState: 1, // OPEN
                send: vi.fn(),
                close: vi.fn(),
                on: vi.fn((event: string, cb: Function) => {
                    if (!listeners[event]) listeners[event] = []
                    listeners[event].push(cb)
                }),
                emit: (event: string, ...args: any[]) => {
                    listeners[event]?.forEach((cb) => cb(...args))
                },
            }
        }

        it('should send ERROR and close socket if table does not exist', async () => {
            vi.mocked(prisma.table.findUnique).mockResolvedValueOnce(null)

            const socket = createMockSocket()
            const request = {
                server: {
                    getCurrentUser: () => ({ id: userId, role: 'PLAYER' }),
                },
                params: { id: tableId },
            } as any

            await tableWebSocketHandler(socket as any, request)

            expect(socket.send).toHaveBeenCalledWith(
                JSON.stringify({ type: 'ERROR', message: 'Table not found' }),
            )
            expect(socket.close).toHaveBeenCalled()
        })

        it('should send ERROR and close socket if table is CLOSED', async () => {
            vi.mocked(prisma.table.findUnique).mockResolvedValueOnce({
                ...baseTable,
                status: 'CLOSED',
            } as any)

            const socket = createMockSocket()
            const request = {
                server: {
                    getCurrentUser: () => ({ id: userId, role: 'PLAYER' }),
                },
                params: { id: tableId },
            } as any

            await tableWebSocketHandler(socket as any, request)

            expect(socket.send).toHaveBeenCalledWith(
                JSON.stringify({ type: 'ERROR', message: 'Table is closed' }),
            )
            expect(socket.close).toHaveBeenCalled()
        })

        it('should register connection and send TABLE_CONNECTED with initial state', async () => {
            vi.mocked(prisma.table.findUnique).mockResolvedValueOnce(baseTable as any)

            const socket = createMockSocket()
            const request = {
                server: {
                    getCurrentUser: () => ({ id: userId, role: 'PLAYER' }),
                },
                params: { id: tableId },
            } as any

            await tableWebSocketHandler(socket as any, request)

            expect(tableManager.getConnectionsCount(tableId)).toBe(1)
            expect(socket.send).toHaveBeenCalledWith(
                expect.stringContaining('"type":"TABLE_CONNECTED"'),
            )
        })

        it('should respond with PONG when receiving PING message', async () => {
            vi.mocked(prisma.table.findUnique).mockResolvedValueOnce(baseTable as any)

            const socket = createMockSocket()
            const request = {
                server: {
                    getCurrentUser: () => ({ id: userId, role: 'PLAYER' }),
                },
                params: { id: tableId },
            } as any

            await tableWebSocketHandler(socket as any, request)

            socket.emit('message', Buffer.from(JSON.stringify({ type: 'PING' })))

            expect(socket.send).toHaveBeenCalledWith(expect.stringContaining('"type":"PONG"'))
        })

        it('should broadcast table update and seated player event to connected sockets on buy-in', async () => {
            // Conecta um socket na mesa
            const socket = createMockSocket()
            tableManager.addConnection(tableId, socket as any, userId)

            vi.mocked(prisma.table.findUnique).mockResolvedValueOnce(baseTable as any)

            const mockTx = {
                user: {
                    findUnique: vi.fn().mockResolvedValueOnce({ id: 1, userName: 'player1' }),
                },
                account: {
                    findUnique: vi
                        .fn()
                        .mockResolvedValueOnce({ id: 10, balance: 5000n })
                        .mockResolvedValueOnce({ id: 20, balance: 0n }),
                    update: vi.fn().mockResolvedValue({ id: 10, balance: 4000n }),
                },
                ledgerEntry: {
                    createMany: vi.fn().mockResolvedValueOnce({ count: 2 }),
                },
            }
            vi.mocked(prisma.$transaction).mockImplementationOnce(async (fn: any) => fn(mockTx))

            await buyInService({ tableId, userId, amount: 1000 })

            // Socket deve ter recebido TABLE_UPDATED e PLAYER_SEATED
            expect(socket.send).toHaveBeenCalledWith(
                expect.stringContaining('"type":"TABLE_UPDATED"'),
            )
            expect(socket.send).toHaveBeenCalledWith(
                expect.stringContaining('"type":"PLAYER_SEATED"'),
            )
        })

        it('should broadcast player left event to connected sockets on leave', async () => {
            // Senta jogador e adiciona socket
            tableManager.sitPlayer(
                tableId,
                0,
                { id: userId, name: 'Player1' },
                1000,
                baseTable.config as any,
            )
            const socket = createMockSocket()
            tableManager.addConnection(tableId, socket as any, userId)

            vi.mocked(prisma.table.findUnique).mockResolvedValueOnce(baseTable as any)

            const mockTx = {
                user: {
                    findUnique: vi.fn().mockResolvedValueOnce({ id: 1 }),
                },
                account: {
                    findUnique: vi
                        .fn()
                        .mockResolvedValueOnce({ id: 20, balance: 1000n })
                        .mockResolvedValueOnce({ id: 10, balance: 3000n }),
                    update: vi.fn().mockResolvedValue({ id: 20, balance: 0n }),
                },
                ledgerEntry: {
                    createMany: vi.fn().mockResolvedValueOnce({ count: 2 }),
                },
            }
            vi.mocked(prisma.$transaction).mockImplementationOnce(async (fn: any) => fn(mockTx))

            await leaveTableService({ tableId, userId })

            expect(socket.send).toHaveBeenCalledWith(
                expect.stringContaining('"type":"PLAYER_LEFT"'),
            )
        })
    })
})
