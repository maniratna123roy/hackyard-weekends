import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../../db/prisma.js';
import { authenticate } from '../../middleware/auth.js';

export async function userRoutes(app: FastifyInstance) {
  // GET /api/v1/users/me
  app.get('/me', { preHandler: [authenticate] }, async (request, reply) => {
    return reply.send({ data: { user: request.user } });
  });

  // PATCH /api/v1/users/me
  app.patch('/me', { preHandler: [authenticate] }, async (request, reply) => {
    const updateSchema = z.object({
      name: z.string().optional(),
      username: z.string().optional(),
      college: z.string().optional(),
      bio: z.string().optional(),
      skills: z.array(z.string()).optional(),
      links: z.record(z.string()).optional(),
      preferences: z.record(z.any()).optional(),
      onboardingDone: z.boolean().optional()
    });

    const parsed = updateSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: { code: 'VALIDATION_ERROR', message: 'Invalid update payload' } });
    }

    const { skills, links, preferences, ...directFields } = parsed.data;
    const dataToUpdate: any = { ...directFields };
    if (skills !== undefined) dataToUpdate.skills = JSON.stringify(skills);
    if (links !== undefined) dataToUpdate.links = JSON.stringify(links);
    if (preferences !== undefined) dataToUpdate.preferences = JSON.stringify(preferences);

    const updated = await prisma.user.update({
      where: { id: request.user!.id },
      data: dataToUpdate
    });

    return reply.send({
      data: {
        user: {
          id: updated.id,
          name: updated.name,
          username: updated.username,
          email: updated.email,
          role: updated.role,
          avatarUrl: updated.avatarUrl,
          college: updated.college,
          bio: updated.bio,
          skills: skills || (updated.skills ? JSON.parse(updated.skills) : []),
          links: links || (updated.links ? JSON.parse(updated.links) : {}),
          preferences: preferences || (updated.preferences ? JSON.parse(updated.preferences) : {}),
          emailVerified: updated.emailVerified,
          onboardingDone: updated.onboardingDone
        }
      }
    });
  });

  // GET /api/v1/users/:username
  app.get('/:username', async (request, reply) => {
    const { username } = request.params as { username: string };
    const user = await prisma.user.findUnique({
      where: { username },
      select: {
        id: true,
        name: true,
        username: true,
        role: true,
        avatarUrl: true,
        college: true,
        bio: true,
        skills: true,
        links: true,
        createdAt: true
      }
    });

    if (!user) {
      return reply.status(404).send({ error: { code: 'NOT_FOUND', message: 'User not found' } });
    }

    return reply.send({
      data: {
        profile: {
          ...user,
          skills: user.skills ? JSON.parse(user.skills) : [],
          links: user.links ? JSON.parse(user.links) : {}
        },
        missionRecord: [],
        badges: [],
        certificates: []
      }
    });
  });
}
