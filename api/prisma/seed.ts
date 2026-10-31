import { randomBytes } from 'node:crypto'
import { prisma } from '../src/lib/prisma'
import { hashPassword } from '../src/lib/password'
import { env } from '../src/config/env'
import { HOUSE_EMAIL } from '../src/config/system'

async function main() {
    const { ADMIN_EMAIL: email, ADMIN_PASSWORD: password } = env

    if (!email || !password) {
        throw new Error('Set ADMIN_EMAIL and ADMIN_PASSWORD in the .env file')
    }

    const house = await prisma.user.upsert({
        where: { email: HOUSE_EMAIL },
        update: {},
        create: {
            userName: 'HOUSE',
            userNameLower: 'house',
            email: HOUSE_EMAIL,
            passwordHash: await hashPassword(randomBytes(32).toString('hex')),
            role: 'SYSTEM',
        },
    })

    for (const type of ['HOUSE', 'HOUSE_RESERVE'] as const) {
        for (const currency of ['PLAY', 'USD'] as const) {
            await prisma.account.upsert({
                where: { userId_type_currency: { userId: house.id, type, currency } },
                create: { userId: house.id, type, currency },
                update: {},
            })
        }
    }

    await prisma.user.upsert({
        where: { email },
        update: {},
        create: {
            userName: 'Admin',
            userNameLower: 'admin',
            email,
            passwordHash: await hashPassword(password),
            role: 'ADMIN',
        },
    })

    console.log('Seed concluído')
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(() => prisma.$disconnect())
