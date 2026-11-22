import { FastifyInstance } from 'fastify';
import { prisma } from '../../db/prisma.js';
import { authenticate, requireRole } from '../../middleware/auth.js';

export async function adminRoutes(app: FastifyInstance) {
  // Guard all admin routes with requireRole(['admin'])
  app.addHook('preHandler', authenticate);
  app.addHook('preHandler', requireRole(['admin']));

  // GET /api/v1/admin/startups
  app.get('/startups', async (request, reply) => {
    const startups = await prisma.startup.findMany({
      include: { owner: true },
      orderBy: { createdAt: 'desc' }
    });
    return reply.send({ data: { startups } });
  });

  // PATCH /api/v1/admin/startups/:id/review
  app.patch('/startups/:id/review', async (request, reply) => {
    const { id } = request.params as { id: string };
    const { decision, note } = request.body as { decision: 'approved' | 'rejected'; note?: string };

    const startup = await prisma.startup.update({
      where: { id },
      data: {
        status: decision,
        reviewNote: note,
        reviewedBy: request.user!.id
      }
    });
    return reply.send({ data: { startup } });
  });

  // GET /api/v1/admin/missions
  app.get('/missions', async (request, reply) => {
    const missions = await prisma.mission.findMany({
      include: {
        startup: true,
        event: true,
        _count: { select: { teams: true, submissions: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
    return reply.send({ data: { missions } });
  });

  // PATCH /api/v1/admin/missions/:id/review
  app.patch('/missions/:id/review', async (request, reply) => {
    const { id } = request.params as { id: string };
    const { decision, note } = request.body as { decision: 'approved' | 'rejected'; note?: string };

    const mission = await prisma.mission.update({
      where: { id },
      data: {
        status: decision,
        reviewNote: note,
        reviewedBy: request.user!.id
      }
    });
    return reply.send({ data: { mission } });
  });

  // POST /api/v1/admin/events (Create event)
  app.post('/events', async (request, reply) => {
    const body = request.body as any;
    const event = await prisma.event.create({
      data: {
        title: body.title,
        description: body.description,
        mode: body.mode || 'online',
        venue: body.venue,
        registrationOpensAt: new Date(body.registrationOpensAt || Date.now()),
        kickoffAt: new Date(body.kickoffAt || Date.now() + 24 * 3600 * 1000),
        deadlineAt: new Date(body.deadlineAt || Date.now() + 48 * 3600 * 1000),
        judgingEndsAt: new Date(body.judgingEndsAt || Date.now() + 72 * 3600 * 1000),
        status: body.status || 'live',
        createdBy: request.user!.id
      }
    });
    return reply.status(201).send({ data: { event } });
  });

  // GET /api/v1/admin/users
  app.get('/users', async (request, reply) => {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' }
    });
    return reply.send({ data: { users } });
  });

  // PATCH /api/v1/admin/users/:id
  app.patch('/users/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const { banned, role } = request.body as { banned?: boolean; role?: string };

    const user = await prisma.user.update({
      where: { id },
      data: {
        banned: banned !== undefined ? banned : undefined,
        role: role !== undefined ? role : undefined
      }
    });
    return reply.send({ data: { user } });
  });

  // GET /api/v1/admin/analytics
  app.get('/analytics', async (request, reply) => {
    const [usersCount, startupsCount, missionsCount, teamsCount, submissionsCount] = await Promise.all([
      prisma.user.count(),
      prisma.startup.count(),
      prisma.mission.count(),
      prisma.team.count(),
      prisma.submission.count({ where: { isFinal: true } })
    ]);

    return reply.send({
      data: {
        usersCount,
        startupsCount,
        missionsCount,
        teamsCount,
        submissionsCount,
        submissionRate: teamsCount > 0 ? Math.round((submissionsCount / teamsCount) * 100) : 0
      }
    });
  });
}
