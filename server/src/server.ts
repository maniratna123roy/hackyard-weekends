import { buildApp } from './app.js';
import { env } from './config/env.js';

async function main() {
  const app = await buildApp();
  // Render requires binding to 0.0.0.0
  const host = '0.0.0.0';
  const port = Number(process.env.PORT) || env.PORT || 10000;
  await app.listen({ port, host });
  console.log(`🚀 Hackyard Weekends Fastify API running on port ${port} (${host})`);
}

main().catch((err) => {
  console.error('Fatal server startup error:', err);
  process.exit(1);
});
