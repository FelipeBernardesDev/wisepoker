import { describe, expect, it, vi, beforeEach } from 'vitest'
import { registerService } from '../src/services/auth/index.js'
import { prisma } from '../src/lib/prisma.js'
import { ConflictError, NotFoundError } from '../src/errors/index.js'
import { HOUSE_EMAIL } from '../src/config/system.js'

vi.mock('../src/lib/prisma.js', () => ({
    prisma: {
        user: {
            findFirst: vi.fn(),
        },
        $transaction: vi.fn(),
    },
}))

vi.mock('../src/lib/password.js', () => ({
    hashPassword: vi.fn().mockResolvedValue('hashed_password'),
    comparePassword: vi.fn(),
}))

function createMockTx() {
    return {
        user: {
            create: vi.fn(),
        },
        account: {
            findFirst: vi.fn(),
            update: vi.fn(),
        },
        ledgerEntry: {
            create: vi.fn(),
        },
    }
}

describe('Auth Service', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    describe('registerService', () => {
        it('should throw ConflictError if user already exists', async () => {
            vi.mocked(prisma.user.findFirst).mockResolvedValueOnce({ id: 1 } as any)

            await expect(
                registerService({
                    userName: 'testuser',
                    email: 'test@example.com',
                    password: 'password123',
                }),
            ).rejects.toThrow(ConflictError)
        })

        it('should create user with double-entry FREE_CLAIM welcome bonus', async () => {
            vi.mocked(prisma.user.findFirst).mockResolvedValueOnce(null)

            const mockTx = createMockTx()
            mockTx.user.create.mockResolvedValueOnce({
                id: 1,
                publicId: '11111111-1111-4111-8111-111111111111',
                role: 'PLAYER',
                userName: 'TestUser',
            })
            mockTx.account.findFirst.mockResolvedValueOnce({
                id: 99,
                type: 'HOUSE_RESERVE',
                currency: 'PLAY',
                balance: 1_000_000n,
            })
            mockTx.account.update.mockResolvedValueOnce({})
            mockTx.ledgerEntry.create.mockResolvedValueOnce({})

            vi.mocked(prisma.$transaction).mockImplementationOnce(async (fn: any) =>
                fn(mockTx),
            )

            const result = await registerService({
                userName: 'TestUser',
                email: 'test@example.com',
                password: 'password123',
            })

            expect(result).toEqual({
                id: 1,
                publicId: '11111111-1111-4111-8111-111111111111',
                role: 'PLAYER',
                userName: 'TestUser',
            })

            // Verify user creation with 4 accounts
            expect(mockTx.user.create).toHaveBeenCalledTimes(1)
            const createCall = mockTx.user.create.mock.calls[0][0]
            const accounts = createCall.data.accounts.create as any[]

            expect(accounts).toHaveLength(4)

            // MAIN PLAY with FREE_CLAIM welcome bonus
            expect(accounts[0]).toMatchObject({
                type: 'MAIN',
                currency: 'PLAY',
                balance: 10_000n,
            })
            const playerEntry = accounts[0].entries.create[0]
            expect(playerEntry).toMatchObject({
                amount: 10_000n,
                type: 'FREE_CLAIM',
                referenceId: 'WELCOME_BONUS',
            })
            expect(playerEntry.transactionId).toMatch(
                /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
            )

            // IN_PLAY PLAY
            expect(accounts[1]).toMatchObject({ type: 'IN_PLAY', currency: 'PLAY', balance: 0n })
            // MAIN USD
            expect(accounts[2]).toMatchObject({ type: 'MAIN', currency: 'USD', balance: 0n })
            // IN_PLAY USD
            expect(accounts[3]).toMatchObject({ type: 'IN_PLAY', currency: 'USD', balance: 0n })

            // Verify HOUSE_RESERVE lookup filters by house email
            expect(mockTx.account.findFirst).toHaveBeenCalledWith({
                where: {
                    type: 'HOUSE_RESERVE',
                    currency: 'PLAY',
                    user: { email: HOUSE_EMAIL },
                },
            })

            // Verify HOUSE_RESERVE balance decrement
            expect(mockTx.account.update).toHaveBeenCalledWith({
                where: { id: 99 },
                data: { balance: { decrement: 10_000n } },
            })

            // Verify HOUSE_RESERVE ledger entry: same transactionId, same type, negative amount
            expect(mockTx.ledgerEntry.create).toHaveBeenCalledWith({
                data: {
                    accountId: 99,
                    transactionId: playerEntry.transactionId,
                    amount: -10_000n,
                    type: 'FREE_CLAIM',
                    referenceId: 'WELCOME_BONUS',
                },
            })
        })

        it('should throw NotFoundError if HOUSE_RESERVE account does not exist', async () => {
            vi.mocked(prisma.user.findFirst).mockResolvedValueOnce(null)

            const mockTx = createMockTx()
            mockTx.user.create.mockResolvedValueOnce({
                id: 1,
                publicId: '11111111-1111-4111-8111-111111111111',
                role: 'PLAYER',
                userName: 'TestUser',
            })
            mockTx.account.findFirst.mockResolvedValueOnce(null)

            vi.mocked(prisma.$transaction).mockImplementationOnce(async (fn: any) =>
                fn(mockTx),
            )

            await expect(
                registerService({
                    userName: 'TestUser',
                    email: 'test@example.com',
                    password: 'password123',
                }),
            ).rejects.toThrow(NotFoundError)
        })
    })
})
