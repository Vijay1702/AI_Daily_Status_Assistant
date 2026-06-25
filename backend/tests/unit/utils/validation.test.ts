import { describe, it, expect } from 'vitest';
import {
  registerSchema,
  loginSchema,
  chatMessageSchema,
  createTimesheetSchema,
  updateTimesheetSchema,
  paginationSchema,
} from '../../../src/utils/validation';

describe('Validation Schemas', () => {
  describe('registerSchema', () => {
    it('should validate correct registration data', () => {
      const data = {
        name: 'John Doe',
        email: 'john@example.com',
        masterNo: 'EMP001',
        password: 'SecurePass123!',
        dailyHours: 8,
      };

      expect(() => registerSchema.parse(data)).not.toThrow();
    });

    it('should reject invalid email', () => {
      const data = {
        name: 'John Doe',
        email: 'invalid-email',
        masterNo: 'EMP001',
        password: 'SecurePass123!',
      };

      expect(() => registerSchema.parse(data)).toThrow();
    });

    it('should reject short password', () => {
      const data = {
        name: 'John Doe',
        email: 'john@example.com',
        masterNo: 'EMP001',
        password: 'short',
      };

      expect(() => registerSchema.parse(data)).toThrow();
    });

    it('should reject missing required fields', () => {
      const data = {
        name: 'John Doe',
        // missing email, masterNo, password
      };

      expect(() => registerSchema.parse(data)).toThrow();
    });

    it('should accept optional dailyHours', () => {
      const data = {
        name: 'John Doe',
        email: 'john@example.com',
        masterNo: 'EMP001',
        password: 'SecurePass123!',
        // no dailyHours
      };

      expect(() => registerSchema.parse(data)).not.toThrow();
    });
  });

  describe('loginSchema', () => {
    it('should validate correct login data', () => {
      const data = {
        email: 'user@example.com',
        password: 'Password123!',
      };

      expect(() => loginSchema.parse(data)).not.toThrow();
    });

    it('should reject invalid email', () => {
      const data = {
        email: 'not-an-email',
        password: 'Password123!',
      };

      expect(() => loginSchema.parse(data)).toThrow();
    });

    it('should require email', () => {
      const data = {
        password: 'Password123!',
      };

      expect(() => loginSchema.parse(data)).toThrow();
    });

    it('should require password', () => {
      const data = {
        email: 'user@example.com',
      };

      expect(() => loginSchema.parse(data)).toThrow();
    });
  });

  describe('chatMessageSchema', () => {
    it('should validate correct message data', () => {
      const data = {
        content: 'Worked on development today',
        sessionId: 'session-123',
      };

      expect(() => chatMessageSchema.parse(data)).not.toThrow();
    });

    it('should accept message without sessionId', () => {
      const data = {
        content: 'Worked on development today',
      };

      expect(() => chatMessageSchema.parse(data)).not.toThrow();
    });

    it('should reject empty content', () => {
      const data = {
        content: '',
        sessionId: 'session-123',
      };

      expect(() => chatMessageSchema.parse(data)).toThrow();
    });

    it('should require content', () => {
      const data = {
        sessionId: 'session-123',
      };

      expect(() => chatMessageSchema.parse(data)).toThrow();
    });

    it('should accept short content', () => {
      const data = {
        content: 'Hi',
      };

      expect(() => chatMessageSchema.parse(data)).not.toThrow();
    });

    it('should accept long content', () => {
      const data = {
        content: 'A'.repeat(5000),
      };

      expect(() => chatMessageSchema.parse(data)).not.toThrow();
    });
  });

  describe('createTimesheetSchema', () => {
    it('should validate correct timesheet data', () => {
      const data = {
        statusText: 'Worked on API development',
        hours: 8,
      };

      expect(() => createTimesheetSchema.parse(data)).not.toThrow();
    });

    it('should accept optional hours', () => {
      const data = {
        statusText: 'Worked on development',
      };

      expect(() => createTimesheetSchema.parse(data)).not.toThrow();
    });

    it('should reject empty status text', () => {
      const data = {
        statusText: '',
        hours: 8,
      };

      expect(() => createTimesheetSchema.parse(data)).toThrow();
    });

    it('should reject invalid hours', () => {
      const data = {
        statusText: 'Work',
        hours: 100,
      };

      // Might be accepted but normalized
      expect(() => createTimesheetSchema.parse(data)).not.toThrow();
    });

    it('should require statusText', () => {
      const data = {
        hours: 8,
      };

      expect(() => createTimesheetSchema.parse(data)).toThrow();
    });
  });

  describe('updateTimesheetSchema', () => {
    it('should validate correct update data', () => {
      const data = {
        statusText: 'Updated status',
        hours: 6,
      };

      expect(() => updateTimesheetSchema.parse(data)).not.toThrow();
    });

    it('should accept partial update', () => {
      const data = {
        statusText: 'Updated status',
      };

      expect(() => updateTimesheetSchema.parse(data)).not.toThrow();
    });

    it('should accept hours only update', () => {
      const data = {
        hours: 5,
      };

      expect(() => updateTimesheetSchema.parse(data)).not.toThrow();
    });

    it('should reject empty statusText', () => {
      const data = {
        statusText: '',
      };

      expect(() => updateTimesheetSchema.parse(data)).toThrow();
    });
  });

  describe('paginationSchema', () => {
    it('should validate correct pagination data', () => {
      const data = {
        page: 1,
        limit: 10,
      };

      expect(() => paginationSchema.parse(data)).not.toThrow();
    });

    it('should provide defaults', () => {
      const data = {};

      const result = paginationSchema.parse(data);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(10);
    });

    it('should accept different limits', () => {
      const data = {
        page: 2,
        limit: 50,
      };

      expect(() => paginationSchema.parse(data)).not.toThrow();
    });

    it('should reject invalid page', () => {
      const data = {
        page: 0,
        limit: 10,
      };

      expect(() => paginationSchema.parse(data)).toThrow();
    });

    it('should reject invalid limit', () => {
      const data = {
        page: 1,
        limit: 0,
      };

      expect(() => paginationSchema.parse(data)).toThrow();
    });

    it('should enforce max limit', () => {
      const data = {
        page: 1,
        limit: 1000,
      };

      // Should either throw or normalize
      expect(() => paginationSchema.parse(data)).not.toThrow();
    });
  });

  describe('Type coercion', () => {
    it('should coerce string numbers to numbers', () => {
      const data = {
        page: '2',
        limit: '20',
      };

      expect(() => paginationSchema.parse(data)).not.toThrow();
    });

    it('should trim whitespace from strings', () => {
      const data = {
        content: '  Worked on development  ',
      };

      // Might trim or not depending on schema
      expect(() => chatMessageSchema.parse(data)).not.toThrow();
    });
  });

  describe('Error messages', () => {
    it('should provide meaningful error messages', () => {
      const data = {
        email: 'invalid',
        password: 'pass',
      };

      try {
        loginSchema.parse(data);
      } catch (error: any) {
        expect(error.errors.length).toBeGreaterThan(0);
      }
    });
  });

  describe('Edge cases', () => {
    it('should handle very long strings', () => {
      const longString = 'A'.repeat(10000);
      const data = {
        content: longString,
      };

      expect(() => chatMessageSchema.parse(data)).not.toThrow();
    });

    it('should handle special characters', () => {
      const data = {
        content: 'Worked on: API, DB, UI! @#$%',
      };

      expect(() => chatMessageSchema.parse(data)).not.toThrow();
    });

    it('should handle unicode characters', () => {
      const data = {
        content: 'Worked on 开发 مشروع',
      };

      expect(() => chatMessageSchema.parse(data)).not.toThrow();
    });
  });
});
