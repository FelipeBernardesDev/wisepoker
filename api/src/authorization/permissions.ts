import { AbilityBuilder } from '@casl/ability'
import { User } from './models/user.js'
import { AppAbility } from './index.js'
import { Role } from './roles.js'

type PermissionsByRole = (user: User, builder: AbilityBuilder<AppAbility>) => void

export const permissions: Record<Role, PermissionsByRole> = {
    ADMIN(user, { can }) {
        can('manage', 'all')
    },

    PLAYER(user, { can }) {
        can('read', 'User')
        can('update', 'User', { id: user.id })
        can('delete', 'User', { id: user.id })
    },
}
