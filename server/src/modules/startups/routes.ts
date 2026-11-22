import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../../db/prisma.js';
import { authenticate, requireRole } from '../../middleware/auth.js';

export async function startupRoutes(app: FastifyInstance) {
  // POST /api/v1/startups
  app.post('/', { preHandler: [authenticate, requireRole(['founder'])] }, async (request, reply) => {
    const schema = z.object({
      name: z.string().min(1),
      logoUrl: z.string().optional(),
      website: z.string().optional(),
      stage: z.string().optional(),
      description: z.string().optional()
    });

    const parsed = schema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: { code: 'VALIDATION_ERROR', message: 'Invalid payload' } });
    }

    const existing = await prisma.startup.findFirst({
      where: { ownerId: request.user!.id }
    });

    if (existing) {
      return reply.status(409).send({ error: { code: 'CONFLICT', message: 'You already have a startup registered' } });
    }

    const startup = await prisma.startup.create({
      data: {
        ownerId: request.user!.id,
        name: parsed.data.name,
        logoUrl: parsed.data.logoUrl,
        website: parsed.data.website,
        stage: parsed.data.stage,
        description: parsed.data.description,
        status: 'pending'
      }
    });

    return reply.status(201).send({ data: { startup } });
  });

  // GET /api/v1/startups/me
  app.get('/me', { preHandler: [authenticate, requireRole(['founder'])] }, async (request, reply) => {
    const startup = await prisma.startup.findFirst({
      where: { ownerId: request.user!.id }
    });
    return reply.send({ data: { startup } });
  });

  // PATCH /api/v1/startups/:id
  app.patch('/:id', { preHandler: [authenticate, requireRole(['founder', 'admin'])] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const startup = await prisma.startup.findUnique({ where: { id } });

    if (!startup) {
      return reply.status(404).send({ error: { code: 'NOT_FOUND', message: 'Startup not found' } });
    }

    if (request.user!.role !== 'admin' && startup.ownerId !== request.user!.id) {
      return reply.status(403).send({ error: { code: 'FORBIDDEN', message: 'Not authorized' } });
    }

    const schema = z.object({
      name: z.string().optional(),
      logoUrl: z.string().optional(),
      website: z.string().optional(),
      stage: z.string().optional(),
      description: z.string().optional()
    });

    const parsed = schema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: { code: 'VALIDATION_ERROR', message: 'Invalid payload' } });
    }

    const updated = await prisma.startup.update({
      where: { id },
      data: {
        ...parsed.data,
        version: { increment: 1 }
      }
    });

    return reply.send({ data: { startup: updated } });
  });
}
