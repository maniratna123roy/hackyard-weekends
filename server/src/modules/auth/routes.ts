import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../../db/prisma.js';
import { env } from '../../config/env.js';
import { generateSessionToken, hashToken } from '../../utils/auth.js';
import { authenticate } from '../../middleware/auth.js';

const sessionSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1).optional(),
  role: z.enum(['participant', 'founder']).optional(),
  adminAccessCode: z.string().optional()
});

export async function authRoutes(app: FastifyInstance) {
  // POST /api/v1/auth/session
  app.post('/session', async (request, reply) => {
    const parseResult = sessionSchema.safeParse(request.body);
    if (!parseResult.success) {
      return reply.status(400).send({
        error: { code: 'VALIDATION_ERROR', message: 'Invalid payload', details: parseResult.error.flatten() }
      });
    }

    const { email: rawEmail, name: inputName, role: inputRole, adminAccessCode } = parseResult.data;
    const email = rawEmail.toLowerCase().trim();
    const adminEmails = env.ADMIN_EMAILS.toLowerCase().split(',').map(e => e.trim());
    const isAdminEmail = adminEmails.includes(email);

    // If email is an admin email, verify admin access code
    if (isAdminEmail) {
      if (!adminAccessCode) {
        return reply.status(403).send({
          error: { code: 'ADMIN_CODE_REQUIRED', message: 'Admin access code is required for admin credentials' }
        });
      }
      if (adminAccessCode !== env.ADMIN_ACCESS_CODE) {
        return reply.status(403).send({
          error: { code: 'ADMIN_CODE_INVALID', message: 'Invalid admin credentials or password' }
        });
      }
    }

    // Look up existing user
    let user = await prisma.user.findUnique({
      where: { email },
      include: { startups: true }
    });

    let isNew = false;

    if (user) {
      if (user.banned) {
        return reply.status(403).send({
          error: { code: 'BANNED', message: 'This account has been banned' }
        });
      }

      // USER REQUIREMENT 1: One email is accessible to its registered role only!
      // If user registered as participant, they cannot sign up or sign in as founder or admin, and vice-versa.
      // If inputRole is provided, verify it strictly matches their assigned role.
      if (inputRole && user.role !== inputRole) {
        return reply.status(403).send({
          error: {
            code: 'ROLE_MISMATCH',
            message: `This email is already registered as a ${user.role}. A ${user.role} account cannot be used to sign in or sign up as a ${inputRole}. Please sign in with your ${user.role} role.`
          }
        });
      }

      // If user is admin email, ensure their role is admin
      if (isAdminEmail && user.role !== 'admin') {
        user = await prisma.user.update({
          where: { id: user.id },
          data: { role: 'admin' },
          include: { startups: true }
        });
      }
    } else {
      // New user registration
      isNew = true;
      const targetRole = isAdminEmail ? 'admin' : (inputRole || 'participant');
      const name = inputName || (isAdminEmail ? 'Hackyard Admin' : email.split('@')[0]);
      
      // Generate unique username
      const baseSlug = name.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 15) || 'user';
      const randomSuffix = Math.floor(1000 + Math.random() * 9000);
      const username = `${baseSlug}${randomSuffix}`;

      user = await prisma.user.create({
        data: {
          email,
          name,
          username,
          role: targetRole,
          emailVerified: true,
          onboardingDone: true
        },
        include: { startups: true }
      });
    }

    // Create session token
    const token = generateSessionToken();
    const tokenHash = hashToken(token);
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

    await prisma.session.create({
      data: {
        userId: user.id,
        tokenHash,
        expiresAt
      }
    });

    // Set HTTPOnly cookie
    reply.setCookie('session', token, {
      path: '/',
      httpOnly: true,
      secure: env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60
    });

    let skills: string[] = [];
    try { skills = user.skills ? JSON.parse(user.skills) : []; } catch {}
    let links: Record<string, string> = {};
    try { links = user.links ? JSON.parse(user.links) : {}; } catch {}
    let preferences: Record<string, any> = {};
    try { preferences = user.preferences ? JSON.parse(user.preferences) : {}; } catch {}

    const startup = user.startups?.[0] || null;

    return reply.send({
      data: {
        user: {
          id: user.id,
          name: user.name,
          username: user.username,
          email: user.email,
          role: user.role,
          avatarUrl: user.avatarUrl,
          college: user.college,
          bio: user.bio,
          skills,
          links,
          preferences,
          emailVerified: user.emailVerified,
          onboardingDone: user.onboardingDone
        },
        startup: startup ? {
          id: startup.id,
          name: startup.name,
          logoUrl: startup.logoUrl,
          website: startup.website,
          stage: startup.stage,
          description: startup.description,
          status: startup.status
        } : null,
        isNew
      }
    });
  });

  // POST /api/v1/auth/logout
  app.post('/logout', async (request, reply) => {
    const sessionToken = request.cookies['session'];
    if (sessionToken) {
      const tokenHash = hashToken(sessionToken);
      await prisma.session.deleteMany({ where: { tokenHash } }).catch(() => {});
    }
    reply.clearCookie('session', { path: '/' });
    return reply.status(204).send();
  });

  // GET /api/v1/auth/me
  app.get('/me', { preHandler: [authenticate] }, async (request, reply) => {
    if (!request.user) {
      return reply.status(401).send({ error: { code: 'UNAUTHENTICATED', message: 'Not logged in' } });
    }

    const startup = await prisma.startup.findFirst({
      where: { ownerId: request.user.id }
    });

    return reply.send({
      data: {
        user: request.user,
        startup: startup ? {
          id: startup.id,
          name: startup.name,
          logoUrl: startup.logoUrl,
          website: startup.website,
          stage: startup.stage,
          description: startup.description,
          status: startup.status
        } : null
      }
    });
  });
}
