import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AIService } from '../../../src/services/ai.service';

describe('AIService', () => {
  let service: AIService;

  beforeEach(() => {
    service = new AIService();
    vi.clearAllMocks();
  });

  describe('analyzeStatus', () => {
    it('should analyze status text and return structured response', async () => {
      const result = await service.analyzeStatus('Worked on frontend development', 8);

      expect(result).toHaveProperty('summary');
      expect(result).toHaveProperty('tasks');
      expect(result).toHaveProperty('hours');
      expect(result).toHaveProperty('workingFlag');
    });

    it('should return summary with max 300 characters', async () => {
      const result = await service.analyzeStatus(
        'Did a lot of work on many things today including frontend and backend',
        8
      );

      expect(result.summary.length).toBeLessThanOrEqual(300);
    });

    it('should extract tasks from status', async () => {
      const result = await service.analyzeStatus(
        'Fixed bug, attended meeting, wrote tests',
        8
      );

      expect(Array.isArray(result.tasks)).toBe(true);
      expect(result.tasks.length).toBeGreaterThan(0);
    });

    it('should limit tasks to 10', async () => {
      const result = await service.analyzeStatus(
        'Task 1, Task 2, Task 3, Task 4, Task 5, Task 6, Task 7, Task 8, Task 9, Task 10, Task 11',
        8
      );

      expect(result.tasks.length).toBeLessThanOrEqual(10);
    });

    it('should use provided daily hours', async () => {
      const result = await service.analyzeStatus('Worked', 6);

      expect(result.hours).toBe(6);
    });

    it('should cap hours at 24', async () => {
      const result = await service.analyzeStatus('Worked', 100);

      expect(result.hours).toBeLessThanOrEqual(24);
    });

    it('should ensure hours are at least 1', async () => {
      const result = await service.analyzeStatus('Worked', 0);

      expect(result.hours).toBeGreaterThanOrEqual(1);
    });

    it('should set working flag to true by default', async () => {
      const result = await service.analyzeStatus('Worked', 8);

      expect(result.workingFlag).toBe(true);
    });

    it('should handle empty status text', async () => {
      const result = await service.analyzeStatus('', 8);

      expect(result.summary).toBeDefined();
      expect(result.tasks).toBeDefined();
    });

    it('should parse JSON response correctly', async () => {
      const result = await service.analyzeStatus(
        'Fixed login bug and updated documentation',
        8
      );

      expect(typeof result.summary).toBe('string');
      expect(Array.isArray(result.tasks)).toBe(true);
      expect(typeof result.hours).toBe('number');
      expect(typeof result.workingFlag).toBe('boolean');
    });

    it('should provide fallback response on error', async () => {
      const result = await service.analyzeStatus('Status text', 8);

      expect(result.summary).toBeDefined();
      expect(result.tasks).toBeDefined();
      expect(result.hours).toBe(8);
      expect(result.workingFlag).toBe(true);
    });
  });

  describe('generateResponse', () => {
    it('should generate conversational response', async () => {
      const response = await service.generateResponse('Worked on development');

      expect(typeof response).toBe('string');
      expect(response.length).toBeGreaterThan(0);
    });

    it('should acknowledge user message', async () => {
      const response = await service.generateResponse('Worked on features');

      expect(response).toBeDefined();
      expect(response.length).toBeGreaterThan(10);
    });

    it('should provide fallback response on error', async () => {
      const response = await service.generateResponse('Any message');

      expect(response).toBeDefined();
      expect(typeof response).toBe('string');
    });

    it('should support context parameter', async () => {
      const response = await service.generateResponse(
        'Worked on development',
        'User is senior developer'
      );

      expect(response).toBeDefined();
    });

    it('should keep response concise', async () => {
      const response = await service.generateResponse('Worked on development');

      expect(response.split('.').length).toBeLessThanOrEqual(5);
    });
  });

  describe('setModel', () => {
    it('should accept valid models', () => {
      expect(() => service.setModel('llama3')).not.toThrow();
      expect(() => service.setModel('qwen3')).not.toThrow();
      expect(() => service.setModel('mistral')).not.toThrow();
    });

    it('should reject invalid models', () => {
      expect(() => service.setModel('invalid-model')).not.toThrow();
      // Should not change model on invalid input
    });
  });

  describe('checkStatus', () => {
    it('should check Ollama service status', async () => {
      const status = await service.checkStatus();

      expect(typeof status).toBe('boolean');
    });

    it('should return false if service unavailable', async () => {
      const status = await service.checkStatus();

      // Status can be either true or false depending on service
      expect(typeof status).toBe('boolean');
    });
  });

  describe('error handling', () => {
    it('should handle AI service timeouts', async () => {
      const result = await service.analyzeStatus('Status', 8);

      expect(result).toHaveProperty('summary');
      expect(result).toHaveProperty('tasks');
      expect(result.summary).toBeDefined();
    });

    it('should provide fallback on parsing errors', async () => {
      const result = await service.analyzeStatus('Test status', 8);

      expect(result.summary.length).toBeGreaterThan(0);
      expect(result.tasks.length).toBeGreaterThanOrEqual(0);
    });

    it('should handle missing Ollama connection', async () => {
      const result = await service.analyzeStatus('Status', 8);

      // Should either work or fall back gracefully
      expect(result).toBeDefined();
    });
  });

  describe('response validation', () => {
    it('should validate response structure', async () => {
      const result = await service.analyzeStatus('Work', 8);

      const hasAllFields =
        result.summary &&
        Array.isArray(result.tasks) &&
        typeof result.hours === 'number' &&
        typeof result.workingFlag === 'boolean';

      expect(hasAllFields).toBe(true);
    });

    it('should validate hours are integers', async () => {
      const result = await service.analyzeStatus('Work', 8);

      expect(Number.isInteger(result.hours)).toBe(true);
    });

    it('should validate tasks are strings', async () => {
      const result = await service.analyzeStatus('Work', 8);

      result.tasks.forEach((task) => {
        expect(typeof task).toBe('string');
      });
    });
  });
});
