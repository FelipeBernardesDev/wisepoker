import { describe, expect, it, vi, beforeEach } from 'vitest'
import {
    claimFreeChipsService,
    getWalletLedgerService,
    getWalletService,
} from '../src/services/wallet/index.js'
import { prisma } from '../src/lib/prisma.js'
import { ConflictError, ForbiddenError, NotFoundError } from '../src/errors/index.js'
import { FREE_CHIPS_AMOUNT } from '../src/config/wallet.js'
import { HOUSE_EMAIL } from '../src/config/system.js'

vi.mock('../src/lib/prisma.js', () => ({
    prisma: {
        user: {
            findUnique: vi.fn(),
            updateMany: vi.fn(),
        },
        account: {
            findMany: vi.fn(),
            findUnique: vi.fn(),
            findFirst: vi.fn(),
            update: vi.fn(),
        },
        ledgerEntry: {
            count: vi.fn(),
            findMany: vi.fn(),
            createMany: vi.fn(),
        },
        $transaction: vi.fn(),
    },
}))

describe('Wallet Service', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    describe('getWalletService', () => {
        it('should throw NotFoundError if user does not exist', async () => {
            vi.mocked(prisma.user.findUnique).mockResolvedValueOnce(null)

            await expect(getWalletService('non-existent-user')).rejects.toThrow(NotFoundError)
        })

        it('should return user accounts and balances formatted', async () => {
            vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({ id: 1 } as any)
            vi.mocked(prisma.account.findMany).mockResolvedValueOnce([
                {
                    publicId: '11111111-1111-4111-8111-111111111111',
                    type: 'MAIN',
                    currency: 'PLAY',
                    balance: 10000n,
                    createdAt: new Date('2026-10-27T19:00:00Z'),
                },
                {
                    publicId: '22222222-2222-4222-8222-222222222222',
                    type: 'IN_PLAY',
                    currency: 'PLAY',
                    balance: 500n,
                    createdAt: new Date('2026-10-27T19:05:00Z'),
                },
            ] as any)

            const result = await getWalletService('some-public-id')

            expect(result).toEqual({
                accounts: [
                    {
                        id: '11111111-1111-4111-8111-111111111111',
                        type: 'MAIN',
                        currency: 'PLAY',
                        balance: 10000,
                        createdAt: new Date('2026-10-27T19:00:00Z'),
                    },
                    {
                        id: '22222222-2222-4222-8222-222222222222',
                        type: 'IN_PLAY',
                        currency: 'PLAY',
                        balance: 500,
                        createdAt: new Date('2026-10-27T19:05:00Z'),
                    },
                ],
            })
        })
    })

    describe('getWalletLedgerService', () => {
        it('should throw NotFoundError if user does not exist', async () => {
            vi.mocked(prisma.user.findUnique).mockResolvedValueOnce(null)

            await expect(
                getWalletLedgerService('non-existent-user', { page: 1, limit: 10 }),
            ).rejects.toThrow(NotFoundError)
        })

        it('should return paginated ledger entries and metadata', async () => {
            vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({ id: 1 } as any)
            vi.mocked(prisma.$transaction).mockResolvedValueOnce([
                15,
                [
                    {
                        publicId: '33333333-3333-4333-8333-333333333333',
                        amount: 10000n,
                        type: 'DEPOSIT',
                        referenceId: 'WELCOME_BONUS',
                        createdAt: new Date('2026-10-27T19:00:00Z'),
                        account: {
                            publicId: '11111111-1111-4111-8111-111111111111',
                            type: 'MAIN',
                            currency: 'PLAY',
                        },
                    },
                ],
            ] as any)

            const result = await getWalletLedgerService('some-public-id', { page: 1, limit: 10 })

            expect(result).toEqual({
                entries: [
                    {
                        id: '33333333-3333-4333-8333-333333333333',
                        amount: 10000,
                        type: 'DEPOSIT',
                        referenceId: 'WELCOME_BONUS',
                        account: {
                            id: '11111111-1111-4111-8111-111111111111',
                            type: 'MAIN',
                            currency: 'PLAY',
                        },
                        createdAt: new Date('2026-10-27T19:00:00Z'),
                    },
                ],
                pagination: {
                    page: 1,
                    limit: 10,
                    total: 15,
                    totalPages: 2,
                },
            })
        })
    })

    describe('claimFreeChipsService', () => {
        const userId = '11111111-1111-4111-8111-111111111111'

        it('should throw ConflictError if cooldown has not passed yet', async () => {
            const nextClaimAt = new Date(Date.now() + 2 * 60 * 60 * 1000)

            const mockTx = {
                user: {
                    updateMany: vi.fn().mockResolvedValueOnce({ count: 0 }),
                    findUnique: vi.fn().mockResolvedValueOnce({
                        id: 1,
                        status: 'ACTIVE',
                        freeChipsNextClaimAt: nextClaimAt,
                    }),
                },
            }

            vi.mocked(prisma.$transaction).mockImplementationOnce(async (fn: any) => fn(mockTx))

            await expect(claimFreeChipsService(userId)).rejects.toThrow(ConflictError)
        })

        it('should throw ForbiddenError if user is not ACTIVE', async () => {
            const mockTx = {
                user: {
                    updateMany: vi.fn().mockResolvedValueOnce({ count: 0 }),
                    findUnique: vi.fn().mockResolvedValueOnce({
                        id: 1,
                        status: 'BANNED',
                    }),
                },
            }

            vi.mocked(prisma.$transaction).mockImplementationOnce(async (fn: any) => fn(mockTx))

            await expect(claimFreeChipsService(userId)).rejects.toThrow(ForbiddenError)
        })

        it('should throw NotFoundError if user does not exist', async () => {
            const mockTx = {
                user: {
                    updateMany: vi.fn().mockResolvedValueOnce({ count: 0 }),
                    findUnique: vi.fn().mockResolvedValueOnce(null),
                },
            }

            vi.mocked(prisma.$transaction).mockImplementationOnce(async (fn: any) => fn(mockTx))

            await expect(claimFreeChipsService(userId)).rejects.toThrow(NotFoundError)
        })

        it('should successfully claim free chips with double-entry ledger', async () => {
            const mockTx = {
                user: {
                    updateMany: vi.fn().mockResolvedValueOnce({ count: 1 }),
                    findUnique: vi.fn().mockResolvedValueOnce({ id: 1 }),
                },
                account: {
                    findUnique: vi.fn().mockResolvedValueOnce({ id: 10, balance: 10_000n }),
                    findFirst: vi.fn().mockResolvedValueOnce({ id: 99, balance: 1_000_000n }),
                    update: vi.fn().mockImplementation(({ where, data }) => {
                        if (where.id === 10) {
                            return Promise.resolve({ balance: 25_000n })
                        }
                        return Promise.resolve({ balance: 985_000n })
                    }),
                },
                ledgerEntry: {
                    createMany: vi.fn().mockResolvedValueOnce({ count: 2 }),
                },
            }

            vi.mocked(prisma.$transaction).mockImplementationOnce(async (fn: any) => fn(mockTx))

            const result = await claimFreeChipsService(userId)

            expect(result.amount).toBe(FREE_CHIPS_AMOUNT)
            expect(result.balance).toBe(25_000n)
            expect(result.nextClaimAt).toBeInstanceOf(Date)

            // Assert HOUSE_RESERVE query by house email
            expect(mockTx.account.findFirst).toHaveBeenCalledWith({
                where: {
                    type: 'HOUSE_RESERVE',
                    currency: 'PLAY',
                    user: { email: HOUSE_EMAIL },
                },
            })

            // Assert user account query
            expect(mockTx.account.findUnique).toHaveBeenCalledWith({
                where: {
                    userId_type_currency: {
                        userId: 1,
                        type: 'MAIN',
                        currency: 'PLAY',
                    },
                },
            })

            // Assert ledger entries created with matching transactionId and FREE_CLAIM type
            expect(mockTx.ledgerEntry.createMany).toHaveBeenCalledWith({
                data: expect.arrayContaining([
                    expect.objectContaining({
                        accountId: 99,
                        amount: -FREE_CHIPS_AMOUNT,
                        type: 'FREE_CLAIM',
                        referenceId: 'FREE_CHIPS_REFILL',
                    }),
                    expect.objectContaining({
                        accountId: 10,
                        amount: FREE_CHIPS_AMOUNT,
                        type: 'FREE_CLAIM',
                        referenceId: 'FREE_CHIPS_REFILL',
                    }),
                ]),
            })

            const entries = mockTx.ledgerEntry.createMany.mock.calls[0][0].data
            expect(entries[0].transactionId).toBe(entries[1].transactionId)
        })
    })
})
