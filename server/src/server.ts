import { buildApp } from './app.js';
import { env } from './config/env.js';

async function main() {
  const app = await buildApp();
  const host = process.env.HOST || '0.0.0.0';
  await app.listen({ port: env.PORT, host });
  console.log(`🚀 Hackyard Weekends Fastify API running on port ${env.PORT} (${host})`);
}

main().catch((err) => {
  console.error('Fatal server startup error:', err);
  process.exit(1);
});
