import 'dotenv/config'
import { z } from 'zod'

const envSchema = z.object({
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
    PORT: z.coerce.number().default(3000),
    HOST: z.string().default('localhost'),
    DATABASE_URL: z.url(),
    CORS_ORIGINS: z
        .string()
        .transform((value) => value.split(',').map((origin) => origin.trim()))
        .pipe(z.array(z.url())),
    JWT_SECRET: z.string(),
    COOKIE_SECRET: z.string(),
    JWT_EXPIRES_IN_SECONDS: z.coerce.number().default(900),
    JWT_REFRESH_EXPIRES_IN_SECONDS: z.coerce.number().default(604800),
    RATE_LIMIT_MAX: z.coerce.number().default(100),
})

const _env = envSchema.safeParse(process.env)

if (!_env.success) {
    console.error('Invalid environment variables!', z.treeifyError(_env.error))
    throw new Error('Invalid environment variables!')
}

const env = _env.data

export { env }
