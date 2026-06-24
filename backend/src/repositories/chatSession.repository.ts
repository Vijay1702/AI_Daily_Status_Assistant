import { prisma } from '../utils/db.js';
import { ChatSession, Message } from '@prisma/client';

export class ChatSessionRepository {
  async findById(id: string): Promise<ChatSession | null> {
    return prisma.chatSession.findUnique({
      where: { id },
    });
  }

  async create(data: { userId: string; sessionTitle: string }): Promise<ChatSession> {
    return prisma.chatSession.create({
      data,
    });
  }

  async findByUserId(userId: string, skip: number = 0, take: number = 10): Promise<ChatSession[]> {
    return prisma.chatSession.findMany({
      where: { userId },
      skip,
      take,
      orderBy: { createdAt: 'desc' },
    });
  }

  async delete(id: string): Promise<ChatSession> {
    return prisma.chatSession.delete({
      where: { id },
    });
  }

  async countByUserId(userId: string): Promise<number> {
    return prisma.chatSession.count({
      where: { userId },
    });
  }
}

export class MessageRepository {
  async findById(id: string): Promise<Message | null> {
    return prisma.message.findUnique({
      where: { id },
    });
  }

  async create(data: { sessionId: string; role: string; content: string }): Promise<Message> {
    return prisma.message.create({
      data,
    });
  }

  async findBySessionId(sessionId: string, skip: number = 0, take: number = 50): Promise<Message[]> {
    return prisma.message.findMany({
      where: { sessionId },
      skip,
      take,
      orderBy: { createdAt: 'asc' },
    });
  }

  async countBySessionId(sessionId: string): Promise<number> {
    return prisma.message.count({
      where: { sessionId },
    });
  }

  async deleteBySessionId(sessionId: string): Promise<number> {
    const result = await prisma.message.deleteMany({
      where: { sessionId },
    });
    return result.count;
  }
}

export const chatSessionRepository = new ChatSessionRepository();
export const messageRepository = new MessageRepository();
