import { FastifyRequest, FastifyReply } from 'fastify';
import { prisma } from '../db/prisma.js';
import { hashToken } from '../utils/auth.js';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  username: string;
  role: 'participant' | 'founder' | 'admin';
  avatarUrl: string | null;
  college: string | null;
  bio: string | null;
  skills: string[];
  links: Record<string, string>;
  preferences: Record<string, any>;
  emailVerified: boolean;
  banned: boolean;
  onboardingDone: boolean;
}

declare module 'fastify' {
  interface FastifyRequest {
    user?: AuthUser;
  }
}

export async function authenticate(request: FastifyRequest, reply: FastifyReply) {
  const sessionToken = request.cookies['session'];
  if (!sessionToken) {
    return reply.status(401).send({
      error: { code: 'UNAUTHENTICATED', message: 'Authentication required' }
    });
  }

  const tokenHash = hashToken(sessionToken);
  const session = await prisma.session.findUnique({
    where: { tokenHash },
    include: { user: true }
  });

  if (!session || session.expiresAt < new Date()) {
    if (session) {
      await prisma.session.delete({ where: { id: session.id } }).catch(() => {});
    }
    reply.clearCookie('session', { path: '/' });
    return reply.status(401).send({
      error: { code: 'UNAUTHENTICATED', message: 'Session expired or invalid' }
    });
  }

  if (session.user.banned) {
    return reply.status(403).send({
      error: { code: 'BANNED', message: 'Account is banned' }
    });
  }

  let skills: string[] = [];
  try {
    skills = session.user.skills ? JSON.parse(session.user.skills) : [];
  } catch {}

  let links: Record<string, string> = {};
  try {
    links = session.user.links ? JSON.parse(session.user.links) : {};
  } catch {}

  let preferences: Record<string, any> = {};
  try {
    preferences = session.user.preferences ? JSON.parse(session.user.preferences) : {};
  } catch {}

  request.user = {
    id: session.user.id,
    email: session.user.email,
    name: session.user.name,
    username: session.user.username,
    role: session.user.role as 'participant' | 'founder' | 'admin',
    avatarUrl: session.user.avatarUrl,
    college: session.user.college,
    bio: session.user.bio,
    skills,
    links,
    preferences,
    emailVerified: session.user.emailVerified,
    banned: session.user.banned,
    onboardingDone: session.user.onboardingDone
  };
}

export function requireRole(allowedRoles: ('participant' | 'founder' | 'admin')[]) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    if (!request.user) {
      return reply.status(401).send({
        error: { code: 'UNAUTHENTICATED', message: 'Authentication required' }
      });
    }

    if (!allowedRoles.includes(request.user.role)) {
      return reply.status(403).send({
        error: { code: 'ROLE_NOT_ALLOWED', message: `Role ${request.user.role} is not permitted for this action` }
      });
    }
  };
}
