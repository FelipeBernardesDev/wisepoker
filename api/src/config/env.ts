import 'dotenv/config'
import { z } from 'zod'

const envSchema = z.object({
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
    PORT: z.coerce.number().default(3000),
    HOST: z.string().default('localhost'),
    DATABASE_URL: z.url(),
})

const _env = envSchema.safeParse(process.env)

if (!_env.success) {
    console.error('Invalid environment variables!', z.treeifyError(_env.error))
    throw new Error('Invalid environment variables!')
}

const env = _env.data

export { env }
