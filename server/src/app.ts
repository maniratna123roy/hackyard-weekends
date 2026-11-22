import Fastify from 'fastify';
import cookie from '@fastify/cookie';
import cors from '@fastify/cors';
import { env } from './config/env.js';
import { authRoutes } from './modules/auth/routes.js';
import { userRoutes } from './modules/users/routes.js';
import { startupRoutes } from './modules/startups/routes.js';
import { eventRoutes } from './modules/events/routes.js';
import { missionRoutes } from './modules/missions/routes.js';
import { teamRoutes } from './modules/teams/routes.js';
import { submissionRoutes } from './modules/submissions/routes.js';
import { judgingRoutes } from './modules/judging/routes.js';
import { adminRoutes } from './modules/admin/routes.js';

export async function buildApp() {
  const app = Fastify({
    logger: env.NODE_ENV === 'development'
  });

  // CORS
  await app.register(cors, {
    origin: [env.APP_URL, 'http://localhost:3000', 'http://127.0.0.1:3000'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS']
  });

  // Cookie
  await app.register(cookie, {
    secret: env.SESSION_SECRET
  });

  // Health
  app.get('/api/v1/health', async () => {
    return { status: 'ok', db: true, timestamp: new Date().toISOString() };
  });

  // Modules registration
  await app.register(authRoutes, { prefix: '/api/v1/auth' });
  await app.register(userRoutes, { prefix: '/api/v1/users' });
  await app.register(startupRoutes, { prefix: '/api/v1/startups' });
  await app.register(eventRoutes, { prefix: '/api/v1/events' });
  await app.register(missionRoutes, { prefix: '/api/v1/missions' });
  await app.register(teamRoutes, { prefix: '/api/v1/teams' });
  await app.register(submissionRoutes, { prefix: '/api/v1' });
  await app.register(judgingRoutes, { prefix: '/api/v1' });
  await app.register(adminRoutes, { prefix: '/api/v1/admin' });

  return app;
}
