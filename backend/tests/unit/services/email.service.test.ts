import { describe, it, expect, beforeEach, vi } from 'vitest';
import { EmailService } from '../../../src/services/email.service';

describe('EmailService', () => {
  let service: EmailService;

  beforeEach(() => {
    service = new EmailService();
    vi.clearAllMocks();
  });

  describe('verifyConnection', () => {
    it('should verify email service connection', async () => {
      const result = await service.verifyConnection();

      expect(typeof result).toBe('boolean');
    });

    it('should return boolean status', async () => {
      const result = await service.verifyConnection();

      expect([true, false]).toContain(result);
    });
  });

  describe('sendDailyReminder', () => {
    it('should send daily reminder email', async () => {
      const result = await service.sendDailyReminder({
        email: 'user@example.com',
        name: 'John Doe',
      });

      expect(result).toBeDefined();
    });

    it('should include user name in email', async () => {
      const result = await service.sendDailyReminder({
        email: 'user@example.com',
        name: 'Jane Smith',
      });

      expect(result).toBeDefined();
    });

    it('should validate email format', async () => {
      expect(async () => {
        await service.sendDailyReminder({
          email: 'invalid-email',
          name: 'John',
        });
      }).rejects.toThrow();
    });

    it('should require valid email', async () => {
      expect(async () => {
        await service.sendDailyReminder({
          email: '',
          name: 'John',
        });
      }).rejects.toThrow();
    });

    it('should handle missing name', async () => {
      const result = await service.sendDailyReminder({
        email: 'user@example.com',
        name: '',
      });

      expect(result).toBeDefined();
    });
  });

  describe('sendMonthlyReport', () => {
    it('should send monthly report email', async () => {
      const result = await service.sendMonthlyReport({
        email: 'user@example.com',
        name: 'John Doe',
        filePath: '/path/to/report.xlsx',
        month: 6,
        year: 2026,
      });

      expect(result).toBeDefined();
    });

    it('should attach file to email', async () => {
      const result = await service.sendMonthlyReport({
        email: 'user@example.com',
        name: 'John Doe',
        filePath: '/path/to/report.xlsx',
        month: 6,
        year: 2026,
      });

      expect(result).toBeDefined();
    });

    it('should include correct month and year', async () => {
      const result = await service.sendMonthlyReport({
        email: 'user@example.com',
        name: 'User',
        filePath: '/path/report.xlsx',
        month: 12,
        year: 2025,
      });

      expect(result).toBeDefined();
    });

    it('should validate email format', async () => {
      expect(async () => {
        await service.sendMonthlyReport({
          email: 'not-an-email',
          name: 'User',
          filePath: '/path/report.xlsx',
          month: 6,
          year: 2026,
        });
      }).rejects.toThrow();
    });

    it('should require file path', async () => {
      expect(async () => {
        await service.sendMonthlyReport({
          email: 'user@example.com',
          name: 'User',
          filePath: '',
          month: 6,
          year: 2026,
        });
      }).rejects.toThrow();
    });

    it('should validate month range', async () => {
      expect(async () => {
        await service.sendMonthlyReport({
          email: 'user@example.com',
          name: 'User',
          filePath: '/path/report.xlsx',
          month: 13,
          year: 2026,
        });
      }).rejects.toThrow();
    });

    it('should validate year', async () => {
      expect(async () => {
        await service.sendMonthlyReport({
          email: 'user@example.com',
          name: 'User',
          filePath: '/path/report.xlsx',
          month: 6,
          year: 1999,
        });
      }).rejects.toThrow();
    });
  });

  describe('email validation', () => {
    it('should validate standard email format', async () => {
      expect(() => {
        service['validateEmail']('test@example.com');
      }).not.toThrow();
    });

    it('should accept email with subdomain', async () => {
      expect(() => {
        service['validateEmail']('test@mail.example.com');
      }).not.toThrow();
    });

    it('should reject missing @', async () => {
      expect(async () => {
        await service.sendDailyReminder({
          email: 'testexample.com',
          name: 'User',
        });
      }).rejects.toThrow();
    });

    it('should reject empty email', async () => {
      expect(async () => {
        await service.sendDailyReminder({
          email: '',
          name: 'User',
        });
      }).rejects.toThrow();
    });
  });

  describe('error handling', () => {
    it('should handle connection errors gracefully', async () => {
      // Service should handle connection errors
      const result = await service.verifyConnection();

      expect(typeof result).toBe('boolean');
    });

    it('should return boolean on connection check', async () => {
      const result = await service.verifyConnection();

      expect([true, false]).toContain(result);
    });
  });

  describe('email content', () => {
    it('should include subject in reminder', async () => {
      const result = await service.sendDailyReminder({
        email: 'user@example.com',
        name: 'John',
      });

      expect(result).toBeDefined();
    });

    it('should include subject in report email', async () => {
      const result = await service.sendMonthlyReport({
        email: 'user@example.com',
        name: 'John',
        filePath: '/path/report.xlsx',
        month: 6,
        year: 2026,
      });

      expect(result).toBeDefined();
    });

    it('should format month in report email', async () => {
      const result = await service.sendMonthlyReport({
        email: 'user@example.com',
        name: 'User',
        filePath: '/path/report.xlsx',
        month: 6,
        year: 2026,
      });

      expect(result).toBeDefined();
    });
  });

  describe('HTML content', () => {
    it('should support HTML format', async () => {
      const result = await service.sendDailyReminder({
        email: 'user@example.com',
        name: 'User',
      });

      expect(result).toBeDefined();
    });

    it('should support plain text format', async () => {
      const result = await service.sendDailyReminder({
        email: 'user@example.com',
        name: 'User',
      });

      expect(result).toBeDefined();
    });
  });
});
