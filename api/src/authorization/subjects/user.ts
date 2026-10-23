import { z } from 'zod'
import { userSchema } from '../models/user.js'

export const userSubject = z.tuple([
    z.union([z.literal('manage'), z.literal('read'), z.literal('update'), z.literal('delete')]),
    z.union([z.literal('User'), z.custom<InstanceType<{ new(): { id: string; role: string } }>>()]),
])

export type UserSubject = z.infer<typeof userSubject>

