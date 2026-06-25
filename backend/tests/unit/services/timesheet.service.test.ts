import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TimesheetService } from '../../../src/services/timesheet.service';

describe('TimesheetService', () => {
  let service: TimesheetService;

  beforeEach(() => {
    service = new TimesheetService();
    vi.clearAllMocks();
  });

  describe('createEntry', () => {
    it('should create a new timesheet entry with AI processing', async () => {
      const result = await service.createEntry('user123', {
        statusText: 'Worked on API development for 4 hours',
      });

      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('aiSummary');
      expect(result).toHaveProperty('hours');
      expect(result).toHaveProperty('workDate');
      expect(result.hours).toBeLessThanOrEqual(24);
      expect(result.hours).toBeGreaterThan(0);
    });

    it('should detect duplicate entries for same user same day', async () => {
      const input = { statusText: 'First entry' };
      
      await service.createEntry('user123', input);
      
      expect(async () => {
        await service.createEntry('user123', input);
      }).rejects.toThrow('already submitted');
    });

    it('should use provided hours if specified', async () => {
      const result = await service.createEntry('user123', {
        statusText: 'Worked 3 hours',
        hours: 3,
      });

      expect(result.hours).toBe(3);
    });

    it('should use default daily hours if not provided', async () => {
      const result = await service.createEntry('user123', {
        statusText: 'Worked today',
      });

      expect(result.hours).toBeGreaterThan(0);
    });

    it('should set working flag to true by default', async () => {
      const result = await service.createEntry('user123', {
        statusText: 'Worked today',
      });

      expect(result.workingFlag).toBe(true);
    });

    it('should create entry for different users on same day', async () => {
      const input = { statusText: 'Worked today' };
      
      const result1 = await service.createEntry('user1', input);
      const result2 = await service.createEntry('user2', input);

      expect(result1.id).not.toBe(result2.id);
    });

    it('should allow same user on different days', async () => {
      const input = { statusText: 'Worked today' };
      
      const today = new Date();
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const result1 = await service.createEntry('user123', input);
      const result2 = await service.createEntry('user123', input);

      expect(result1.workDate).not.toEqual(result2.workDate);
    });

    it('should extract tasks from status text', async () => {
      const result = await service.createEntry('user123', {
        statusText: 'Fixed bug, attended meeting, wrote documentation',
      });

      expect(result.aiSummary).toBeDefined();
      expect(result.aiSummary.length).toBeGreaterThan(0);
      expect(result.aiSummary.length).toBeLessThanOrEqual(300);
    });

    it('should handle empty status text', async () => {
      expect(async () => {
        await service.createEntry('user123', {
          statusText: '',
        });
      }).rejects.toThrow();
    });

    it('should cap hours at 24', async () => {
      const result = await service.createEntry('user123', {
        statusText: 'Worked',
        hours: 50,
      });

      expect(result.hours).toBeLessThanOrEqual(24);
    });

    it('should set minimum hours to 1', async () => {
      const result = await service.createEntry('user123', {
        statusText: 'Worked',
        hours: -5,
      });

      expect(result.hours).toBeGreaterThanOrEqual(1);
    });
  });

  describe('getEntries', () => {
    it('should retrieve all entries for a user', async () => {
      await service.createEntry('user123', { statusText: 'Entry 1' });
      await service.createEntry('user123', { statusText: 'Entry 2' });

      const results = await service.getEntries('user123');

      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBeGreaterThanOrEqual(2);
    });

    it('should return empty array for user with no entries', async () => {
      const results = await service.getEntries('nonexistent-user');

      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBe(0);
    });

    it('should support pagination', async () => {
      const results = await service.getEntries('user123', 0, 10);

      expect(results).toBeDefined();
      expect(Array.isArray(results)).toBe(true);
    });
  });

  describe('getMonthlyEntries', () => {
    it('should retrieve entries for a specific month', async () => {
      const results = await service.getMonthlyEntries('user123', 6, 2026);

      expect(Array.isArray(results)).toBe(true);
    });

    it('should calculate monthly statistics', async () => {
      const stats = await service.getMonthlyStats('user123', 6, 2026);

      expect(stats).toHaveProperty('totalHours');
      expect(stats).toHaveProperty('totalDays');
      expect(stats).toHaveProperty('averageHours');
    });

    it('should return correct totals', async () => {
      await service.createEntry('user123', { statusText: 'Work', hours: 5 });
      await service.createEntry('user123', { statusText: 'Work', hours: 3 });

      const stats = await service.getMonthlyStats('user123', 6, 2026);

      expect(stats.totalHours).toBe(8);
    });
  });

  describe('updateEntry', () => {
    it('should update an existing entry', async () => {
      const created = await service.createEntry('user123', {
        statusText: 'Original',
        hours: 5,
      });

      const updated = await service.updateEntry(created.id, {
        statusText: 'Updated',
        hours: 6,
      });

      expect(updated.statusText).toBe('Updated');
      expect(updated.hours).toBe(6);
    });

    it('should fail updating non-existent entry', async () => {
      expect(async () => {
        await service.updateEntry('non-existent', {
          statusText: 'Update',
        });
      }).rejects.toThrow();
    });
  });

  describe('deleteEntry', () => {
    it('should delete an existing entry', async () => {
      const created = await service.createEntry('user123', {
        statusText: 'To delete',
      });

      await service.deleteEntry(created.id);

      const found = await service.getEntryById(created.id);
      expect(found).toBeNull();
    });

    it('should fail deleting non-existent entry', async () => {
      expect(async () => {
        await service.deleteEntry('non-existent');
      }).rejects.toThrow();
    });
  });

  describe('validation', () => {
    it('should validate status text length', async () => {
      expect(async () => {
        await service.createEntry('user123', {
          statusText: '',
        });
      }).rejects.toThrow();
    });

    it('should validate hours are within range', async () => {
      const result = await service.createEntry('user123', {
        statusText: 'Work',
        hours: 100,
      });

      expect(result.hours).toBeLessThanOrEqual(24);
    });

    it('should validate user ID is not empty', async () => {
      expect(async () => {
        await service.createEntry('', {
          statusText: 'Work',
        });
      }).rejects.toThrow();
    });
  });
});
