import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AuthService } from '../../../src/services/auth.service';

describe('AuthService', () => {
  let authService: AuthService;

  beforeEach(() => {
    authService = new AuthService();
    vi.clearAllMocks();
  });

  describe('register', () => {
    it('should register a new user with valid input', async () => {
      const result = await authService.register({
        name: 'Test User',
        email: 'test@example.com',
        masterNo: 'EMP001',
        password: 'Test123!Pass',
        dailyHours: 8,
      });

      expect(result).toHaveProperty('token');
      expect(result).toHaveProperty('user');
      expect(result.user.email).toBe('test@example.com');
      expect(result.user.name).toBe('Test User');
    });

    it('should fail with invalid email format', async () => {
      expect(async () => {
        await authService.register({
          name: 'Test User',
          email: 'invalid-email',
          masterNo: 'EMP001',
          password: 'Test123!Pass',
          dailyHours: 8,
        });
      }).rejects.toThrow();
    });

    it('should fail with weak password', async () => {
      expect(async () => {
        await authService.register({
          name: 'Test User',
          email: 'test@example.com',
          masterNo: 'EMP001',
          password: 'weak',
          dailyHours: 8,
        });
      }).rejects.toThrow();
    });
  });

  describe('login', () => {
    it('should login successfully with correct credentials', async () => {
      const result = await authService.login({
        email: 'test@example.com',
        password: 'Test123!Pass',
      });

      expect(result).toHaveProperty('token');
      expect(result).toHaveProperty('user');
    });

    it('should fail with non-existent email', async () => {
      expect(async () => {
        await authService.login({
          email: 'nonexistent@example.com',
          password: 'Test123!Pass',
        });
      }).rejects.toThrow('Invalid email or password');
    });

    it('should fail with wrong password', async () => {
      expect(async () => {
        await authService.login({
          email: 'test@example.com',
          password: 'WrongPassword123!',
        });
      }).rejects.toThrow('Invalid email or password');
    });
  });

  describe('getProfile', () => {
    it('should return user profile', async () => {
      const result = await authService.getProfile('user123');

      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('name');
      expect(result).toHaveProperty('email');
    });

    it('should fail with non-existent user', async () => {
      expect(async () => {
        await authService.getProfile('non-existent-id');
      }).rejects.toThrow('User not found');
    });
  });

  describe('verifyToken', () => {
    it('should verify valid token', async () => {
      const decoded = await authService.verifyToken(
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6InVzZXIxMjMiLCJlbWFpbCI6InRlc3RAZXhhbXBsZS5jb20iLCJtYXN0ZXJObyI6IkVNUDAwMSJ9.signature'
      );

      expect(decoded).toHaveProperty('id');
      expect(decoded).toHaveProperty('email');
    });

    it('should fail with invalid token', async () => {
      expect(async () => {
        await authService.verifyToken('invalid-token');
      }).rejects.toThrow('Invalid or expired token');
    });
  });
});
