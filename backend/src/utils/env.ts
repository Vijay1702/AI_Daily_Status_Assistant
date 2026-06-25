import { z } from 'zod';
import 'dotenv/config.js';

const envSchema = z.object({
  // Database
  DATABASE_URL: z.string().url(),

  // JWT
  JWT_SECRET: z.string().min(32),
  JWT_EXPIRY: z.string().default('7d'),

  // SMTP
  SMTP_HOST: z.string(),
  SMTP_PORT: z.string().transform(Number),
  SMTP_USER: z.string().email(),
  SMTP_PASS: z.string(),

  // Ollama
  OLLAMA_BASE_URL: z.string().url().default('http://localhost:11434'),
  OLLAMA_MODEL: z.enum(['llama3', 'qwen3', 'mistral']).default('llama3'),

  // Server
  PORT: z.string().transform(Number).default('5000'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  FRONTEND_URL: z.string().url().default('http://localhost:5173'),

  // Email
  DEFAULT_FROM_EMAIL: z.string().email(),
});

export type Env = z.infer<typeof envSchema>;

let validated: Env;

export function getEnv(): Env {
  if (validated) return validated;

  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    console.error('Environment validation failed:');
    console.error(result.error.errors);
    process.exit(1);
  }

  validated = result.data;
  return validated;
}

export const env = getEnv();
