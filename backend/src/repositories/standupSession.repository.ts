import { prisma } from '../utils/db.js';

export class StandupSessionRepository {
  /**
   * Get or create today's standup session
   */
  async getOrCreateToday(userId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const existing = await prisma.standupSession.findUnique({
      where: {
        userId_sessionDate: {
          userId,
          sessionDate: today,
        },
      },
    });

    if (existing) {
      return existing;
    }

    // Create new session
    return prisma.standupSession.create({
      data: {
        userId,
        sessionDate: today,
        stage: 'GREETING',
        work: '',
        hours: null,
        blockers: '',
        tomorrowPlan: '',
      },
    });
  }

  /**
   * Get today's session
   */
  async getToday(userId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return prisma.standupSession.findUnique({
      where: {
        userId_sessionDate: {
          userId,
          sessionDate: today,
        },
      },
    });
  }

  /**
   * Update session with new data and stage
   */
  async update(sessionId: string, data: {
    stage?: string;
    work?: string;
    hours?: number | null;
    blockers?: string;
    tomorrowPlan?: string;
  }) {
    return prisma.standupSession.update({
      where: { id: sessionId },
      data: {
        ...data,
        updatedAt: new Date(),
      },
    });
  }

  /**
   * Mark session as completed
   */
  async complete(sessionId: string) {
    return prisma.standupSession.update({
      where: { id: sessionId },
      data: {
        stage: 'COMPLETED',
        updatedAt: new Date(),
      },
    });
  }
}

export const standupSessionRepository = new StandupSessionRepository();
