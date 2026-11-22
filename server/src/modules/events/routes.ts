import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../../db/prisma.js';
import { authenticate } from '../../middleware/auth.js';

export async function eventRoutes(app: FastifyInstance) {
  // GET /api/v1/events
  app.get('/', async (request, reply) => {
    const events = await prisma.event.findMany({
      orderBy: { kickoffAt: 'asc' },
      include: {
        _count: {
          select: {
            missions: true,
            teams: true,
            registrations: true
          }
        }
      }
    });

    return reply.send({
      data: {
        events: events.map(e => ({
          id: e.id,
          title: e.title,
          description: e.description,
          mode: e.mode,
          venue: e.venue,
          registrationOpensAt: e.registrationOpensAt.toISOString(),
          kickoffAt: e.kickoffAt.toISOString(),
          deadlineAt: e.deadlineAt.toISOString(),
          judgingEndsAt: e.judgingEndsAt.toISOString(),
          status: e.status,
          stats: {
            missions: e._count.missions,
            teams: e._count.teams,
            participants: e._count.registrations
          }
        }))
      }
    });
  });

  // GET /api/v1/events/:id
  app.get('/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const event = await prisma.event.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            missions: true,
            teams: true,
            registrations: true
          }
        }
      }
    });

    if (!event) {
      return reply.status(404).send({ error: { code: 'NOT_FOUND', message: 'Event not found' } });
    }

    return reply.send({
      data: {
        event: {
          id: event.id,
          title: event.title,
          description: event.description,
          mode: event.mode,
          venue: event.venue,
          registrationOpensAt: event.registrationOpensAt.toISOString(),
          kickoffAt: event.kickoffAt.toISOString(),
          deadlineAt: event.deadlineAt.toISOString(),
          judgingEndsAt: event.judgingEndsAt.toISOString(),
          graceSeconds: event.graceSeconds,
          teamSizeMin: event.teamSizeMin,
          teamSizeMax: event.teamSizeMax,
          defaultTeamCap: event.defaultTeamCap,
          status: event.status
        },
        serverTime: new Date().toISOString(),
        stats: {
          missions: event._count.missions,
          teams: event._count.teams,
          participants: event._count.registrations
        }
      }
    });
  });

  // POST /api/v1/events/:id/register
  app.post('/:id/register', { preHandler: [authenticate] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const event = await prisma.event.findUnique({ where: { id } });
    if (!event) {
      return reply.status(404).send({ error: { code: 'NOT_FOUND', message: 'Event not found' } });
    }

    const existing = await prisma.eventRegistration.findUnique({
      where: { eventId_userId: { eventId: id, userId: request.user!.id } }
    });

    if (existing) {
      return reply.status(409).send({ error: { code: 'ALREADY_REGISTERED', message: 'Already registered for this event' } });
    }

    const reg = await prisma.eventRegistration.create({
      data: {
        eventId: id,
        userId: request.user!.id,
        lookingForTeam: (request.body as any)?.lookingForTeam ?? false
      }
    });

    return reply.status(201).send({ data: { registration: reg } });
  });

  // GET /api/v1/events/:id/registration/me
  app.get('/:id/registration/me', { preHandler: [authenticate] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const registration = await prisma.eventRegistration.findUnique({
      where: { eventId_userId: { eventId: id, userId: request.user!.id } }
    });
    return reply.send({ data: { registration } });
  });

  // GET /api/v1/events/:id/results
  app.get('/:id/results', async (request, reply) => {
    const { id } = request.params as { id: string };
    const results = await prisma.result.findMany({
      where: { mission: { eventId: id } },
      include: {
        mission: true,
        team: true
      },
      orderBy: { rank: 'asc' }
    });

    return reply.send({ data: { results } });
  });
}
