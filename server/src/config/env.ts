import { z } from 'zod';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const envSchema = z.object({
  PORT: z.string().default('4000').transform(Number),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  APP_URL: z.string().default('http://localhost:3000'),
  DATABASE_URL: z.string().default('file:./dev.db'),
  SESSION_SECRET: z.string().default('hackyard-super-secret-session-key-32-chars-minimum'),
  SESSION_TTL: z.string().default('30d'),
  ADMIN_EMAILS: z.string().default('hackyard@weekend.com'),
  ADMIN_ACCESS_CODE: z.string().default('hacktheweekend'),
  AUTH_MODE: z.enum(['simple', 'full']).default('simple'),
  COOKIE_DOMAIN: z.string().default('localhost')
});

export const env = envSchema.parse(process.env);
