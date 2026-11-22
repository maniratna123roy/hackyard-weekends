import { FastifyInstance } from 'fastify';
import { prisma } from '../../db/prisma.js';
import { authenticate, requireRole } from '../../middleware/auth.js';

export async function judgingRoutes(app: FastifyInstance) {
  // GET /api/v1/missions/:id/submissions (Founder / Admin)
  app.get('/missions/:id/submissions', { preHandler: [authenticate, requireRole(['founder', 'admin'])] }, async (request, reply) => {
    const { id: missionId } = request.params as { id: string };
    const mission = await prisma.mission.findUnique({
      where: { id: missionId },
      include: { startup: true, criteria: true }
    });

    if (!mission) {
      return reply.status(404).send({ error: { code: 'NOT_FOUND', message: 'Mission not found' } });
    }

    // Verify ownership if founder
    if (request.user!.role === 'founder' && mission.startup.ownerId !== request.user!.id) {
      return reply.status(403).send({ error: { code: 'FORBIDDEN', message: 'You can only view submissions for your own missions' } });
    }

    const submissions = await prisma.submission.findMany({
      where: {
        missionId,
        isFinal: true
      },
      include: {
        team: {
          include: {
            members: { include: { user: true } }
          }
        },
        scores: {
          include: { criterion: true }
        }
      }
    });

    return reply.send({
      data: {
        submissions: submissions.map(s => {
          let payload = {};
          try { payload = JSON.parse(s.payload); } catch {}

          // Compute total score from rubric weights
          const totalScore = s.scores.reduce((sum, sc) => {
            const weight = sc.criterion?.weight ?? 10;
            return sum + (sc.value / 10) * weight;
          }, 0);

          return {
            id: s.id,
            teamId: s.teamId,
            teamName: mission.blindJudging ? null : s.team.name,
            members: mission.blindJudging ? [] : s.team.members.map(m => ({ id: m.user.id, name: m.user.name })),
            payload,
            totalScore: Math.round(totalScore * 10) / 10,
            scoredCriteria: s.scores.length,
            scores: s.scores.map(sc => ({
              id: sc.id,
              criterionId: sc.criterionId,
              value: sc.value,
              comment: sc.comment
            }))
          };
        })
      }
    });
  });

  // GET /api/v1/submissions/:id
  app.get('/submissions/:id', { preHandler: [authenticate, requireRole(['founder', 'admin'])] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const submission = await prisma.submission.findUnique({
      where: { id },
      include: {
        team: { include: { members: { include: { user: true } } } },
        mission: { include: { criteria: true, startup: true } },
        scores: true
      }
    });

    if (!submission) {
      return reply.status(404).send({ error: { code: 'NOT_FOUND', message: 'Submission not found' } });
    }

    if (request.user!.role === 'founder' && submission.mission.startup.ownerId !== request.user!.id) {
      return reply.status(403).send({ error: { code: 'FORBIDDEN', message: 'Not authorized' } });
    }

    let payload = {};
    try { payload = JSON.parse(submission.payload); } catch {}

    return reply.send({
      data: {
        submission: {
          id: submission.id,
          teamId: submission.teamId,
          teamName: submission.mission.blindJudging ? null : submission.team.name,
          payload,
          isFinal: submission.isFinal,
          locked: submission.locked
        },
        rubric: submission.mission.criteria,
        scores: submission.scores
      }
    });
  });

  // PUT /api/v1/submissions/:id/scores (Founder scores submission)
  app.put('/submissions/:id/scores', { preHandler: [authenticate, requireRole(['founder', 'admin'])] }, async (request, reply) => {
    const { id: submissionId } = request.params as { id: string };
    const { scores } = request.body as { scores: { criterionId: string; value: number; comment?: string }[] };

    const submission = await prisma.submission.findUnique({
      where: { id: submissionId },
      include: {
        mission: { include: { criteria: true, startup: true } }
      }
    });

    if (!submission) {
      return reply.status(404).send({ error: { code: 'NOT_FOUND', message: 'Submission not found' } });
    }

    if (request.user!.role === 'founder' && submission.mission.startup.ownerId !== request.user!.id) {
      return reply.status(403).send({ error: { code: 'FORBIDDEN', message: 'Not your mission' } });
    }

    if (submission.mission.status === 'judged') {
      return reply.status(423).send({ error: { code: 'PHASE_LOCKED', message: 'Results have already been published' } });
    }

    // Upsert each score
    for (const sc of scores) {
      await prisma.score.upsert({
        where: {
          submissionId_criterionId: {
            submissionId,
            criterionId: sc.criterionId
          }
        },
        create: {
          submissionId,
          criterionId: sc.criterionId,
          scoredBy: request.user!.id,
          value: Math.max(0, Math.min(10, sc.value)),
          comment: sc.comment || null
        },
        update: {
          value: Math.max(0, Math.min(10, sc.value)),
          comment: sc.comment || null
        }
      });
    }

    // Recompute total score
    const allScores = await prisma.score.findMany({
      where: { submissionId },
      include: { criterion: true }
    });

    const totalScore = allScores.reduce((sum, sc) => {
      const weight = sc.criterion?.weight ?? 10;
      return sum + (sc.value / 10) * weight;
    }, 0);

    return reply.send({
      data: {
        totalScore: Math.round(totalScore * 10) / 10,
        scoresCount: allScores.length
      }
    });
  });

  // POST /api/v1/missions/:id/results/publish
  app.post('/missions/:id/results/publish', { preHandler: [authenticate, requireRole(['founder', 'admin'])] }, async (request, reply) => {
    const { id: missionId } = request.params as { id: string };
    const { ranking } = request.body as { ranking: { teamId: string; rank: number; award?: string; note?: string; totalScore?: number }[] };

    const mission = await prisma.mission.findUnique({
      where: { id: missionId },
      include: { startup: true, rewards: true }
    });

    if (!mission) {
      return reply.status(404).send({ error: { code: 'NOT_FOUND', message: 'Mission not found' } });
    }

    if (request.user!.role === 'founder' && mission.startup.ownerId !== request.user!.id) {
      return reply.status(403).send({ error: { code: 'FORBIDDEN', message: 'Not authorized' } });
    }

    // Delete existing results and insert new ones
    await prisma.result.deleteMany({ where: { missionId } });
    for (const r of ranking) {
      await prisma.result.create({
        data: {
          missionId,
          teamId: r.teamId,
          rank: r.rank,
          totalScore: r.totalScore ?? null,
          award: r.award || (r.rank === 1 ? '1st Place Winner' : r.rank === 2 ? '2nd Place' : r.rank === 3 ? '3rd Place' : null),
          note: r.note || null
        }
      });

      // Create reward claim if reward exists for this rank
      const matchingReward = mission.rewards.find(rw => rw.rank === r.rank);
      if (matchingReward) {
        // Find team members to assign claim or create claim
        const teamMembers = await prisma.teamMember.findMany({ where: { teamId: r.teamId } });
        for (const tm of teamMembers) {
          await prisma.rewardClaim.create({
            data: {
              userId: tm.userId,
              missionRewardId: matchingReward.id,
              status: 'pending'
            }
          });
        }
      }
    }

    // Mark mission as judged
    await prisma.mission.update({
      where: { id: missionId },
      data: {
        status: 'judged',
        resultsPublishedAt: new Date()
      }
    });

    const results = await prisma.result.findMany({
      where: { missionId },
      include: { team: true }
    });

    return reply.send({ data: { results } });
  });
}
