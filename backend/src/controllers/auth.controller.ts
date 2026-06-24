import { Request, Response, NextFunction } from 'express';
import { registerSchema, loginSchema, updateProfileSchema } from '../utils/validation.js';
import { authService } from '../services/auth.service.js';
import { userRepository } from '../repositories/user.repository.js';
import { emailService } from '../services/email.service.js';
import { asyncHandler } from '../middlewares/errorHandler.js';
import logger from '../utils/logger.js';

export class AuthController {
  register = asyncHandler(async (req: Request, res: Response) => {
    const input = registerSchema.parse(req.body);

    const result = await authService.register(input);

    // Send welcome email
    try {
      await emailService.sendWelcomeEmail(input.name, input.email);
    } catch (error) {
      logger.warn('Failed to send welcome email:', error);
      // Don't fail the registration if email fails
    }

    res.status(201).json({
      success: true,
      data: result,
      message: 'Registration successful',
    });
  });

  login = asyncHandler(async (req: Request, res: Response) => {
    const input = loginSchema.parse(req.body);

    const result = await authService.login(input);

    res.json({
      success: true,
      data: result,
      message: 'Login successful',
    });
  });

  logout = asyncHandler(async (req: Request, res: Response) => {
    // JWT is stateless, so logout is just a client-side action
    // We can optionally add token to a blacklist in production
    res.json({
      success: true,
      message: 'Logout successful',
    });
  });

  getProfile = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.userId!;

    const profile = await authService.getProfile(userId);

    res.json({
      success: true,
      data: profile,
    });
  });

  updateProfile = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.userId!;
    const input = updateProfileSchema.parse(req.body);

    const updated = await userRepository.update(userId, input);

    res.json({
      success: true,
      data: {
        id: updated.id,
        name: updated.name,
        masterNo: updated.masterNo,
        email: updated.email,
        dailyHours: updated.dailyHours,
        preferredModel: updated.preferredModel,
        reminderTime: updated.reminderTime,
        createdAt: updated.createdAt,
        updatedAt: updated.updatedAt,
      },
      message: 'Profile updated successfully',
    });
  });
}

export const authController = new AuthController();
