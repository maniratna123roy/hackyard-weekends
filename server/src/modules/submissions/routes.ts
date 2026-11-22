import { FastifyInstance } from 'fastify';
import { prisma } from '../../db/prisma.js';
import { authenticate } from '../../middleware/auth.js';

export async function submissionRoutes(app: FastifyInstance) {
  // GET /api/v1/teams/:id/submission
  app.get('/teams/:id/submission', { preHandler: [authenticate] }, async (request, reply) => {
    const { id: teamId } = request.params as { id: string };
    const team = await prisma.team.findUnique({
      where: { id: teamId },
      include: { event: true }
    });

    if (!team) {
      return reply.status(404).send({ error: { code: 'NOT_FOUND', message: 'Team not found' } });
    }

    const latest = await prisma.submission.findFirst({
      where: { teamId },
      orderBy: { version: 'desc' }
    });

    const versionsCount = await prisma.submission.count({ where: { teamId } });

    let parsedPayload: any = {};
    try {
      if (latest?.payload) parsedPayload = JSON.parse(latest.payload);
    } catch {}

    return reply.send({
      data: {
        latest: latest ? {
          ...latest,
          payload: parsedPayload
        } : null,
        versionsCount,
        isFinal: latest?.isFinal ?? false,
        locked: latest?.locked ?? false,
        deadlineAt: team.event.deadlineAt.toISOString(),
        serverTime: new Date().toISOString()
      }
    });
  });

  // PUT /api/v1/teams/:id/submission/draft
  app.put('/teams/:id/submission/draft', { preHandler: [authenticate] }, async (request, reply) => {
    const { id: teamId } = request.params as { id: string };
    const { payload, baseVersion } = request.body as { payload: any; baseVersion?: number };

    const team = await prisma.team.findUnique({
      where: { id: teamId },
      include: { event: true }
    });

    if (!team) {
      return reply.status(404).send({ error: { code: 'NOT_FOUND', message: 'Team not found' } });
    }

    // Phase check
    const now = new Date();
    if (now > new Date(team.event.deadlineAt.getTime() + team.event.graceSeconds * 1000)) {
      return reply.status(423).send({ error: { code: 'PHASE_LOCKED', message: 'Submissions are closed' } });
    }

    const latest = await prisma.submission.findFirst({
      where: { teamId },
      orderBy: { version: 'desc' }
    });

    if (latest && baseVersion !== undefined && baseVersion < latest.version) {
      return reply.status(409).send({
        error: {
          code: 'VERSION_CONFLICT',
          message: 'A newer draft was saved by a teammate',
          details: { current: latest }
        }
      });
    }

    const nextVersion = (latest?.version ?? 0) + 1;
    const sub = await prisma.submission.create({
      data: {
        teamId,
        missionId: team.missionId,
        version: nextVersion,
        payload: JSON.stringify(payload ?? {}),
        isFinal: false,
        locked: false,
        savedBy: request.user!.id
      }
    });

    return reply.send({
      data: {
        version: sub.version,
        savedAt: sub.updatedAt.toISOString(),
        serverTime: new Date().toISOString()
      }
    });
  });

  // POST /api/v1/teams/:id/submission/final
  app.post('/teams/:id/submission/final', { preHandler: [authenticate] }, async (request, reply) => {
    const { id: teamId } = request.params as { id: string };
    const { payload } = (request.body as any) || {};

    const team = await prisma.team.findUnique({
      where: { id: teamId },
      include: { event: true }
    });

    if (!team) {
      return reply.status(404).send({ error: { code: 'NOT_FOUND', message: 'Team not found' } });
    }

    const now = new Date();
    if (now > new Date(team.event.deadlineAt.getTime() + team.event.graceSeconds * 1000)) {
      return reply.status(423).send({ error: { code: 'PHASE_LOCKED', message: 'Submissions are closed' } });
    }

    let latest = await prisma.submission.findFirst({
      where: { teamId },
      orderBy: { version: 'desc' }
    });

    if (!latest || payload) {
      const nextVersion = (latest?.version ?? 0) + 1;
      latest = await prisma.submission.create({
        data: {
          teamId,
          missionId: team.missionId,
          version: nextVersion,
          payload: JSON.stringify(payload ?? {}),
          isFinal: true,
          locked: false,
          savedBy: request.user!.id
        }
      });
    } else {
      latest = await prisma.submission.update({
        where: { id: latest.id },
        data: { isFinal: true }
      });
    }

    await prisma.team.update({
      where: { id: teamId },
      data: { status: 'submitted' }
    });

    return reply.send({ data: { submission: latest } });
  });
}
