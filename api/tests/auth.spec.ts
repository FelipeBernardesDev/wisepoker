import { describe, expect, it, vi, beforeEach } from 'vitest'
import { registerService } from '../src/services/auth/index.js'
import { prisma } from '../src/lib/prisma.js'
import { ConflictError } from '../src/errors/index.js'

vi.mock('../src/lib/prisma.js', () => ({
    prisma: {
        user: {
            findFirst: vi.fn(),
            create: vi.fn(),
        },
    },
}))

vi.mock('../src/lib/password.js', () => ({
    hashPassword: vi.fn().mockResolvedValue('hashed_password'),
    comparePassword: vi.fn(),
}))

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

        it('should create user with PLAY and USD accounts (MAIN and IN_PLAY)', async () => {
            vi.mocked(prisma.user.findFirst).mockResolvedValueOnce(null)
            vi.mocked(prisma.user.create).mockResolvedValueOnce({
                id: 1,
                publicId: '11111111-1111-4111-8111-111111111111',
                role: 'PLAYER',
                userName: 'TestUser',
            } as any)

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

            expect(prisma.user.create).toHaveBeenCalledWith({
                data: {
                    userName: 'TestUser',
                    userNameLower: 'testuser',
                    email: 'test@example.com',
                    passwordHash: 'hashed_password',
                    accounts: {
                        create: [
                            {
                                type: 'MAIN',
                                currency: 'PLAY',
                                balance: 10_000n,
                                entries: {
                                    create: [
                                        {
                                            amount: 10_000n,
                                            type: 'DEPOSIT',
                                            referenceId: 'WELCOME_BONUS',
                                        },
                                    ],
                                },
                            },
                            {
                                type: 'IN_PLAY',
                                currency: 'PLAY',
                                balance: 0n,
                            },
                            {
                                type: 'MAIN',
                                currency: 'USD',
                                balance: 0n,
                            },
                            {
                                type: 'IN_PLAY',
                                currency: 'USD',
                                balance: 0n,
                            },
                        ],
                    },
                },
                select: {
                    id: true,
                    publicId: true,
                    role: true,
                    userName: true,
                },
            })
        })
    })
})
