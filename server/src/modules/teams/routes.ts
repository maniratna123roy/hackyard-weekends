import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import crypto from 'crypto';
import { prisma } from '../../db/prisma.js';
import { authenticate } from '../../middleware/auth.js';

export async function teamRoutes(app: FastifyInstance) {
  // POST /api/v1/missions/:id/teams (Create team)
  app.post('/missions/:id/teams', { preHandler: [authenticate] }, async (request, reply) => {
    const { id: missionId } = request.params as { id: string };
    const { name } = request.body as { name: string };

    if (!name || !name.trim()) {
      return reply.status(400).send({ error: { code: 'VALIDATION_ERROR', message: 'Team name is required' } });
    }

    const mission = await prisma.mission.findUnique({
      where: { id: missionId },
      include: {
        event: true,
        _count: { select: { teams: true } }
      }
    });

    if (!mission) {
      return reply.status(404).send({ error: { code: 'NOT_FOUND', message: 'Mission not found' } });
    }

    if (mission._count.teams >= mission.teamCap) {
      return reply.status(409).send({ error: { code: 'TEAM_CAP_REACHED', message: 'Team cap for this mission is reached' } });
    }

    // Check if user is already in a team for this event
    const existingMembership = await prisma.teamMember.findUnique({
      where: { eventId_userId: { eventId: mission.eventId, userId: request.user!.id } }
    });

    if (existingMembership) {
      return reply.status(409).send({ error: { code: 'ALREADY_IN_TEAM', message: 'You are already in a team for this event' } });
    }

    // Generate unique invite code
    const inviteCode = crypto.randomBytes(4).toString('hex').toUpperCase();

    const team = await prisma.$transaction(async (tx) => {
      const createdTeam = await tx.team.create({
        data: {
          eventId: mission.eventId,
          missionId,
          name: name.trim(),
          inviteCode,
          status: 'forming'
        }
      });

      await tx.teamMember.create({
        data: {
          teamId: createdTeam.id,
          eventId: mission.eventId,
          userId: request.user!.id,
          isLead: true
        }
      });

      return createdTeam;
    });

    return reply.status(201).send({ data: { team } });
  });

  // GET /api/v1/teams/mine
  app.get('/mine', { preHandler: [authenticate] }, async (request, reply) => {
    const memberships = await prisma.teamMember.findMany({
      where: { userId: request.user!.id },
      include: {
        team: {
          include: {
            mission: true,
            event: true,
            members: { include: { user: true } },
            submissions: { where: { isFinal: true }, take: 1 }
          }
        }
      }
    });

    const teams = memberships.map(m => m.team);
    return reply.send({ data: { teams } });
  });

  // GET /api/v1/teams/:id
  app.get('/:id', { preHandler: [authenticate] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const team = await prisma.team.findUnique({
      where: { id },
      include: {
        mission: true,
        event: true,
        members: { include: { user: true } },
        submissions: { orderBy: { version: 'desc' }, take: 1 }
      }
    });

    if (!team) {
      return reply.status(404).send({ error: { code: 'NOT_FOUND', message: 'Team not found' } });
    }

    return reply.send({ data: { team } });
  });

  // POST /api/v1/teams/join
  app.post('/join', { preHandler: [authenticate] }, async (request, reply) => {
    const { inviteCode } = request.body as { inviteCode: string };
    if (!inviteCode) {
      return reply.status(400).send({ error: { code: 'VALIDATION_ERROR', message: 'Invite code is required' } });
    }

    const team = await prisma.team.findUnique({
      where: { inviteCode: inviteCode.trim().toUpperCase() },
      include: {
        event: true,
        _count: { select: { members: true } }
      }
    });

    if (!team) {
      return reply.status(404).send({ error: { code: 'NOT_FOUND', message: 'Invalid invite code' } });
    }

    if (team._count.members >= team.event.teamSizeMax) {
      return reply.status(409).send({ error: { code: 'CONFLICT', message: 'Team is already full' } });
    }

    const existingMembership = await prisma.teamMember.findUnique({
      where: { eventId_userId: { eventId: team.eventId, userId: request.user!.id } }
    });

    if (existingMembership) {
      return reply.status(409).send({ error: { code: 'ALREADY_IN_TEAM', message: 'You are already in a team for this event' } });
    }

    const member = await prisma.teamMember.create({
      data: {
        teamId: team.id,
        eventId: team.eventId,
        userId: request.user!.id,
        isLead: false
      }
    });

    return reply.send({ data: { team, member } });
  });

  // Chat messages
  app.get('/:id/messages', { preHandler: [authenticate] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const messages = await prisma.message.findMany({
      where: { teamId: id },
      include: { user: true },
      orderBy: { createdAt: 'asc' },
      take: 100
    });

    return reply.send({
      data: {
        messages: messages.map(m => ({
          id: m.id,
          teamId: m.teamId,
          body: m.body,
          createdAt: m.createdAt.toISOString(),
          user: {
            id: m.user.id,
            name: m.user.name,
            avatarUrl: m.user.avatarUrl
          }
        }))
      }
    });
  });

  app.post('/:id/messages', { preHandler: [authenticate] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const { body } = request.body as { body: string };

    if (!body || !body.trim()) {
      return reply.status(400).send({ error: { code: 'VALIDATION_ERROR', message: 'Message body required' } });
    }

    const msg = await prisma.message.create({
      data: {
        teamId: id,
        userId: request.user!.id,
        body: body.trim()
      },
      include: { user: true }
    });

    return reply.status(201).send({
      data: {
        message: {
          id: msg.id,
          teamId: msg.teamId,
          body: msg.body,
          createdAt: msg.createdAt.toISOString(),
          user: {
            id: msg.user.id,
            name: msg.user.name,
            avatarUrl: msg.user.avatarUrl
          }
        }
      }
    });
  });
}
