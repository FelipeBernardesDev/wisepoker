import { AbilityBuilder, CreateAbility, createMongoAbility, MongoAbility } from '@casl/ability'
import { User } from './models/user.js'
import { z } from 'zod'
import { userSubject } from './subjects/user.js'
import { walletSubject } from './subjects/wallet.js'
import { permissions } from './permissions.js'

const appAbilitiesSchema = z.union([
    userSubject,
    walletSubject,
    z.tuple([z.literal('manage'), z.literal('all')]),
])

export type AppAbilities = z.infer<typeof appAbilitiesSchema>

export type AppAbility = MongoAbility<AppAbilities>
export const createAppAbility = createMongoAbility as CreateAbility<AppAbility>

export function defineAbilityFor(user: User) {
    const builder = new AbilityBuilder(createAppAbility)

    if (typeof permissions[user.role] !== 'function') {
        throw new Error(`Unknown role: ${user.role}`)
    }

    permissions[user.role](user, builder)

    const ability = builder.build()

    return ability
}
