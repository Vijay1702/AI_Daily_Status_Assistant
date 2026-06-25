import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { env } from '../utils/env.js';
import { userRepository } from '../repositories/user.repository.js';
import { ValidationError, UnauthorizedError, ConflictError } from '../utils/errors.js';
import { RegisterInput, LoginInput } from '../utils/validation.js';
import { emailService } from './email.service.js';
import logger from '../utils/logger.js';

export class AuthService {
  async register(input: RegisterInput) {
    // Check if email or master number already exists
    const existingEmail = await userRepository.findByEmail(input.email);
    if (existingEmail) {
      throw new ConflictError('Email already in use');
    }

    const existingMasterNo = await userRepository.findByMasterNo(input.masterNo);
    if (existingMasterNo) {
      throw new ConflictError('Master number already in use');
    }

    // Hash password
    const passwordHash = await bcrypt.hash(input.password, 10);

    // Create user
    const user = await userRepository.create({
      email: input.email,
      name: input.name,
      masterNo: input.masterNo,
      passwordHash,
      dailyHours: input.dailyHours || 8,
    });

    logger.info(`User registered: ${user.id}`);

    return this.generateUserResponse(user);
  }

  async login(input: LoginInput) {
    const user = await userRepository.findByEmail(input.email);

    if (!user) {
      throw new UnauthorizedError('Invalid email or password');
    }

    // Compare passwords
    const isPasswordValid = await bcrypt.compare(input.password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedError('Invalid email or password');
    }

    // Check for first-time login
    if (!user.lastLoginAt) {
      try {
        await emailService.sendFirstLoginEmail(user.name, user.email);
        logger.info(`First login email sent to ${user.email}`);
      } catch (error) {
        logger.error(`Failed to send first login email to ${user.email}:`, error);
        // Don't block login if email fails
      }
    }

    // Update lastLoginAt
    await userRepository.update(user.id, { lastLoginAt: new Date() } as any);

    logger.info(`User logged in: ${user.id}`);

    return this.generateUserResponse(user);
  }

  async getProfile(userId: string) {
    const user = await userRepository.findById(userId);

    if (!user) {
      throw new ValidationError('User not found');
    }

    return {
      id: user.id,
      name: user.name,
      masterNo: user.masterNo,
      email: user.email,
      dailyHours: user.dailyHours,
      preferredModel: user.preferredModel,
      reminderTime: user.reminderTime,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  async verifyToken(token: string) {
    try {
      const decoded = jwt.verify(token, env.JWT_SECRET) as {
        id: string;
        email: string;
        masterNo: string;
      };
      return decoded;
    } catch (error) {
      throw new UnauthorizedError('Invalid or expired token');
    }
  }

  private generateUserResponse(user: any) {
    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        masterNo: user.masterNo,
      },
      env.JWT_SECRET,
      {
        expiresIn: env.JWT_EXPIRY as string,
      } as any
    );

    return {
      token,
      user: {
        id: user.id,
        name: user.name,
        masterNo: user.masterNo,
        email: user.email,
        dailyHours: user.dailyHours,
        preferredModel: user.preferredModel,
        reminderTime: user.reminderTime,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    };
  }
}

export const authService = new AuthService();
