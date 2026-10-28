import { describe, expect, it, vi, beforeEach } from 'vitest'
import { getWalletLedgerService, getWalletService } from '../src/services/wallet/index.js'
import { prisma } from '../src/lib/prisma.js'
import { NotFoundError } from '../src/errors/index.js'

vi.mock('../src/lib/prisma.js', () => ({
    prisma: {
        user: {
            findUnique: vi.fn(),
        },
        account: {
            findMany: vi.fn(),
        },
        ledgerEntry: {
            count: vi.fn(),
            findMany: vi.fn(),
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
})

