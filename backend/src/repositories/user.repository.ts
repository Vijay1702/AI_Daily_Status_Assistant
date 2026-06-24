import { prisma } from '../utils/db.js';
import { User } from '@prisma/client';
import { UpdateProfileInput } from '../utils/validation.js';

export class UserRepository {
  async findById(id: string): Promise<User | null> {
    return prisma.user.findUnique({
      where: { id },
    });
  }

  async findByEmail(email: string): Promise<User | null> {
    return prisma.user.findUnique({
      where: { email },
    });
  }

  async findByMasterNo(masterNo: string): Promise<User | null> {
    return prisma.user.findUnique({
      where: { masterNo },
    });
  }

  async create(data: {
    email: string;
    name: string;
    masterNo: string;
    passwordHash: string;
    dailyHours?: number;
  }): Promise<User> {
    return prisma.user.create({
      data: {
        email: data.email,
        name: data.name,
        masterNo: data.masterNo,
        passwordHash: data.passwordHash,
        dailyHours: data.dailyHours || 8,
      },
    });
  }

  async update(id: string, data: UpdateProfileInput): Promise<User> {
    return prisma.user.update({
      where: { id },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.masterNo && { masterNo: data.masterNo }),
        ...(data.email && { email: data.email }),
        ...(data.dailyHours !== undefined && { dailyHours: data.dailyHours }),
        ...(data.preferredModel && { preferredModel: data.preferredModel }),
        ...(data.reminderTime && { reminderTime: data.reminderTime }),
      },
    });
  }

  async delete(id: string): Promise<User> {
    return prisma.user.delete({
      where: { id },
    });
  }

  async findAll(skip: number = 0, take: number = 10): Promise<User[]> {
    return prisma.user.findMany({
      skip,
      take,
      orderBy: { createdAt: 'desc' },
    });
  }

  async count(): Promise<number> {
    return prisma.user.count();
  }
}

export const userRepository = new UserRepository();
