import { describe, expect, it } from 'vitest'
import { defineAbilityFor } from '../src/authorization/index.js'
import { subject } from '@casl/ability'

describe('Authorization (CASL)', () => {
    const adminUser = {
        id: '11111111-1111-4111-8111-111111111111',
        role: 'ADMIN' as const,
    }

    const playerUser = {
        id: '22222222-2222-4222-8222-222222222222',
        role: 'PLAYER' as const,
    }

    const otherUser = {
        id: '33333333-3333-4333-8333-333333333333',
        role: 'PLAYER' as const,
    }

    describe('ADMIN', () => {
        const ability = defineAbilityFor(adminUser)

        it('should be able to manage all', () => {
            expect(ability.can('manage', 'all')).toBe(true)
            expect(ability.can('manage', 'User')).toBe(true)
            expect(ability.can('manage', 'Wallet')).toBe(true)
            expect(ability.can('delete', 'Wallet')).toBe(true)
        })
    })

    describe('PLAYER', () => {
        const ability = defineAbilityFor(playerUser)

        it('should be able to read users and manage own user profile', () => {
            expect(ability.can('read', 'User')).toBe(true)
            expect(ability.can('update', 'User')).toBe(true)
            expect(ability.can('delete', 'User')).toBe(true)

            expect(
                ability.can('update', subject('User', { id: playerUser.id, role: 'PLAYER' })),
            ).toBe(true)
            expect(
                ability.can('update', subject('User', { id: otherUser.id, role: 'PLAYER' })),
            ).toBe(false)
        })

        it('should have general wallet access for route preHandler', () => {
            expect(ability.can('read', 'Wallet')).toBe(true)
            expect(ability.can('get', 'Wallet')).toBe(true)
            expect(ability.can('deposit', 'Wallet')).toBe(true)
            expect(ability.can('withdraw', 'Wallet')).toBe(true)
            expect(ability.can('transfer', 'Wallet')).toBe(true)

            expect(ability.can('manage', 'Wallet')).toBe(false)
            expect(ability.can('delete', 'Wallet')).toBe(false)
        })

        it('should only be able to perform wallet actions on own wallet instance', () => {
            const ownWallet = {
                __caslSubjectType__: 'Wallet' as const,
                id: '44444444-4444-4444-8444-444444444444',
                userId: playerUser.id,
            }

            const otherWallet = {
                __caslSubjectType__: 'Wallet' as const,
                id: '55555555-5555-4555-8555-555555555555',
                userId: otherUser.id,
            }

            expect(ability.can('read', ownWallet)).toBe(true)
            expect(ability.can('deposit', ownWallet)).toBe(true)
            expect(ability.can('withdraw', ownWallet)).toBe(true)
            expect(ability.can('transfer', ownWallet)).toBe(true)

            expect(ability.can('read', otherWallet)).toBe(false)
            expect(ability.can('deposit', otherWallet)).toBe(false)
            expect(ability.can('withdraw', otherWallet)).toBe(false)
            expect(ability.can('transfer', otherWallet)).toBe(false)
            expect(ability.can('delete', ownWallet)).toBe(false)
        })
    })
})
