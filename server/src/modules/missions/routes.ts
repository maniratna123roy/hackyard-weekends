import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../../db/prisma.js';
import { authenticate, requireRole } from '../../middleware/auth.js';

export async function missionRoutes(app: FastifyInstance) {
  // GET /api/v1/events/:eventId/missions (and /api/v1/missions)
  app.get('/events/:eventId/missions', async (request, reply) => {
    const { eventId } = request.params as { eventId: string };
    const missions = await prisma.mission.findMany({
      where: {
        eventId,
        status: 'approved'
      },
      include: {
        startup: true,
        rewards: true,
        _count: {
          select: { teams: true }
        }
      }
    });

    return reply.send({
      data: {
        missions: missions.map(m => ({
          id: m.id,
          title: m.title,
          type: m.type,
          summary: m.summary,
          startup: {
            id: m.startup.id,
            name: m.startup.name,
            logoUrl: m.startup.logoUrl,
            stage: m.startup.stage
          },
          rewards: m.rewards,
          teamCap: m.teamCap,
          teamsCount: m._count.teams,
          slotsLeft: Math.max(0, m.teamCap - m._count.teams),
          status: m.status
        }))
      }
    });
  });

  // GET /api/v1/missions/mine
  app.get('/mine', { preHandler: [authenticate, requireRole(['founder'])] }, async (request, reply) => {
    const startup = await prisma.startup.findFirst({
      where: { ownerId: request.user!.id }
    });

    if (!startup) {
      return reply.send({ data: { missions: [] } });
    }

    const missions = await prisma.mission.findMany({
      where: { startupId: startup.id },
      include: {
        criteria: true,
        rewards: true,
        _count: { select: { teams: true, submissions: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    return reply.send({ data: { missions } });
  });

  // GET /api/v1/missions/:id
  app.get('/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const mission = await prisma.mission.findUnique({
      where: { id },
      include: {
        startup: true,
        criteria: true,
        rewards: true,
        event: true,
        _count: { select: { teams: true } }
      }
    });

    if (!mission) {
      return reply.status(404).send({ error: { code: 'NOT_FOUND', message: 'Mission not found' } });
    }

    // Check brief access permission:
    // founder owner, admin, or participant in a team for this mission after kickoff
    let canViewBrief = false;
    const sessionToken = request.cookies['session'];
    let userRole = '';
    let userId = '';

    if (sessionToken) {
      const session = await prisma.session.findFirst({
        where: { tokenHash: (await import('../../utils/auth.js')).hashToken(sessionToken) },
        include: { user: true }
      });
      if (session) {
        userRole = session.user.role;
        userId = session.user.id;
      }
    }

    if (userRole === 'admin') canViewBrief = true;
    if (userRole === 'founder' && mission.startup.ownerId === userId) canViewBrief = true;

    if (!canViewBrief && userId) {
      const isMemberOfTeam = await prisma.teamMember.findFirst({
        where: {
          userId,
          team: { missionId: id }
        }
      });
      const now = new Date();
      if (isMemberOfTeam && now >= mission.event.kickoffAt) {
        canViewBrief = true;
      }
    }

    let parsedResources = [];
    try {
      parsedResources = mission.resources ? JSON.parse(mission.resources) : [];
    } catch {}

    return reply.send({
      data: {
        mission: {
          id: mission.id,
          eventId: mission.eventId,
          type: mission.type,
          title: mission.title,
          summary: mission.summary,
          briefFull: canViewBrief ? mission.briefFull : null,
          productUrl: canViewBrief ? mission.productUrl : null,
          repoUrl: canViewBrief ? mission.repoUrl : null,
          solvedDefinition: mission.solvedDefinition,
          constraints: mission.constraints,
          resources: canViewBrief ? parsedResources : [],
          teamCap: mission.teamCap,
          blindJudging: mission.blindJudging,
          status: mission.status,
          startup: {
            id: mission.startup.id,
            name: mission.startup.name,
            logoUrl: mission.startup.logoUrl,
            stage: mission.startup.stage,
            description: mission.startup.description
          },
          criteria: mission.criteria,
          rewards: mission.rewards,
          event: {
            id: mission.event.id,
            title: mission.event.title,
            kickoffAt: mission.event.kickoffAt.toISOString(),
            deadlineAt: mission.event.deadlineAt.toISOString(),
            status: mission.event.status
          },
          teamsCount: mission._count.teams,
          slotsLeft: Math.max(0, mission.teamCap - mission._count.teams)
        }
      }
    });
  });

  // POST /api/v1/missions
  app.post('/', { preHandler: [authenticate, requireRole(['founder'])] }, async (request, reply) => {
    const startup = await prisma.startup.findFirst({
      where: { ownerId: request.user!.id }
    });

    if (!startup) {
      return reply.status(400).send({ error: { code: 'NO_STARTUP', message: 'You must register a startup first' } });
    }

    const schema = z.object({
      eventId: z.string().uuid(),
      type: z.string(),
      title: z.string().min(1)
    });

    const parsed = schema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: { code: 'VALIDATION_ERROR', message: 'Invalid payload' } });
    }

    const mission = await prisma.mission.create({
      data: {
        eventId: parsed.data.eventId,
        startupId: startup.id,
        type: parsed.data.type,
        title: parsed.data.title,
        status: 'draft'
      }
    });

    return reply.status(201).send({ data: { mission } });
  });

  // PATCH /api/v1/missions/:id
  app.patch('/:id', { preHandler: [authenticate, requireRole(['founder', 'admin'])] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const mission = await prisma.mission.findUnique({
      where: { id },
      include: { startup: true }
    });

    if (!mission) {
      return reply.status(404).send({ error: { code: 'NOT_FOUND', message: 'Mission not found' } });
    }

    if (request.user!.role !== 'admin' && mission.startup.ownerId !== request.user!.id) {
      return reply.status(403).send({ error: { code: 'FORBIDDEN', message: 'Not authorized' } });
    }

    const body = request.body as any;

    // Handle rubric array replacement if provided
    if (Array.isArray(body.rubric)) {
      await prisma.missionRubricCriterion.deleteMany({ where: { missionId: id } });
      await prisma.missionRubricCriterion.createMany({
        data: body.rubric.map((r: any, idx: number) => ({
          missionId: id,
          name: r.name,
          description: r.description || null,
          weight: Number(r.weight) || 10,
          position: idx
        }))
      });
    }

    // Handle rewards array replacement if provided
    if (Array.isArray(body.rewards)) {
      await prisma.missionReward.deleteMany({ where: { missionId: id } });
      await prisma.missionReward.createMany({
        data: body.rewards.map((rw: any, idx: number) => ({
          missionId: id,
          kind: rw.kind || 'cash',
          description: rw.description || '',
          amount: rw.amount ? Number(rw.amount) : null,
          currency: rw.currency || 'USD',
          rank: rw.rank || idx + 1
        }))
      });
    }

    const updated = await prisma.mission.update({
      where: { id },
      data: {
        title: body.title !== undefined ? body.title : undefined,
        summary: body.summary !== undefined ? body.summary : undefined,
        briefFull: body.briefFull !== undefined ? body.briefFull : undefined,
        productUrl: body.productUrl !== undefined ? body.productUrl : undefined,
        repoUrl: body.repoUrl !== undefined ? body.repoUrl : undefined,
        solvedDefinition: body.solvedDefinition !== undefined ? body.solvedDefinition : undefined,
        constraints: body.constraints !== undefined ? body.constraints : undefined,
        resources: body.resources ? JSON.stringify(body.resources) : undefined,
        teamCap: body.teamCap !== undefined ? Number(body.teamCap) : undefined,
        blindJudging: body.blindJudging !== undefined ? Boolean(body.blindJudging) : undefined,
        version: { increment: 1 }
      },
      include: {
        criteria: true,
        rewards: true
      }
    });

    return reply.send({ data: { mission: updated } });
  });

  // POST /api/v1/missions/:id/submit-for-approval
  app.post('/:id/submit-for-approval', { preHandler: [authenticate, requireRole(['founder'])] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const mission = await prisma.mission.findUnique({
      where: { id },
      include: { criteria: true, rewards: true, startup: true }
    });

    if (!mission) {
      return reply.status(404).send({ error: { code: 'NOT_FOUND', message: 'Mission not found' } });
    }

    if (mission.startup.ownerId !== request.user!.id) {
      return reply.status(403).send({ error: { code: 'FORBIDDEN', message: 'Not owner' } });
    }

    const totalWeight = mission.criteria.reduce((sum, c) => sum + c.weight, 0);
    if (mission.criteria.length > 0 && totalWeight !== 100) {
      return reply.status(400).send({
        error: { code: 'VALIDATION_ERROR', message: `Rubric weights must total 100% (currently ${totalWeight}%)` }
      });
    }

    const updated = await prisma.mission.update({
      where: { id },
      data: { status: 'pending_approval' }
    });

    return reply.send({ data: { mission: updated } });
  });

  // Questions Q&A
  app.get('/:id/questions', async (request, reply) => {
    const { id } = request.params as { id: string };
    const questions = await prisma.question.findMany({
      where: { missionId: id },
      orderBy: { createdAt: 'desc' }
    });
    return reply.send({ data: { questions } });
  });

  app.post('/:id/questions', { preHandler: [authenticate] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const { body } = request.body as { body: string };

    const q = await prisma.question.create({
      data: {
        missionId: id,
        askedBy: request.user!.id,
        body
      }
    });
    return reply.status(201).send({ data: { question: q } });
  });

  app.post('/questions/:id/answer', { preHandler: [authenticate, requireRole(['founder', 'admin'])] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const { answer } = request.body as { answer: string };

    const q = await prisma.question.update({
      where: { id },
      data: {
        answer,
        answeredBy: request.user!.id,
        answeredAt: new Date()
      }
    });
    return reply.send({ data: { question: q } });
  });
}
