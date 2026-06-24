import axios from 'axios';
import { env } from '../utils/env.js';
import logger from '../utils/logger.js';
import { AIResponse } from '../types/index.js';

export class AIService {
  private baseURL: string;
  private model: string;

  constructor() {
    this.baseURL = env.OLLAMA_BASE_URL;
    this.model = env.OLLAMA_MODEL;
  }

  setModel(model: string): void {
    if (['llama3', 'qwen3', 'mistral'].includes(model)) {
      this.model = model;
    }
  }

  async analyzeStatus(statusText: string, dailyHours: number): Promise<AIResponse> {
    try {
      logger.info(`Analyzing status with model: ${this.model}`);

      const prompt = `You are an AI assistant that processes work status updates. 
      
Given the following work status update:
"${statusText}"

Please provide a JSON response with exactly this format (no markdown, pure JSON):
{
  "summary": "A professional 1-2 sentence summary of the work (max 300 characters)",
  "tasks": ["Task 1", "Task 2", "Task 3"],
  "hours": ${dailyHours},
  "workingFlag": true
}

Important:
- The summary must be professional and concise
- Tasks should be clear and specific
- Use the provided daily hours: ${dailyHours}
- workingFlag should always be true unless the status indicates no work was done
- Return only valid JSON, no additional text`;

      const response = await axios.post(
        `${this.baseURL}/api/generate`,
        {
          model: this.model,
          prompt,
          stream: false,
        },
        {
          timeout: 30000,
        }
      );

      const generatedText = response.data.response;
      logger.debug('Raw AI response:', generatedText);

      // Extract JSON from response
      const jsonMatch = generatedText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }

      const parsed = JSON.parse(jsonMatch[0]);

      // Validate response structure
      if (!parsed.summary || !Array.isArray(parsed.tasks) || typeof parsed.hours !== 'number') {
        throw new Error('Invalid response structure');
      }

      // Ensure summary doesn't exceed 300 characters
      if (parsed.summary.length > 300) {
        parsed.summary = parsed.summary.substring(0, 297) + '...';
      }

      return {
        summary: parsed.summary,
        tasks: parsed.tasks.slice(0, 10), // Limit to 10 tasks
        hours: Math.max(0, Math.min(24, parsed.hours)), // Ensure hours are between 0-24
        workingFlag: parsed.workingFlag ?? true,
      };
    } catch (error) {
      logger.error('AI analysis error:', error);

      // Fallback response if AI fails
      return {
        summary: statusText.substring(0, 300),
        tasks: [statusText.split(',')[0] || 'Work completed'],
        hours: dailyHours,
        workingFlag: true,
      };
    }
  }

  async generateResponse(userMessage: string, context: string = ''): Promise<string> {
    try {
      logger.info(`Generating response with model: ${this.model}`);

      const prompt = `You are a helpful AI assistant for a daily status tracking system. 
A user has submitted their work status update: "${userMessage}"

${context ? `Additional context: ${context}` : ''}

Provide a friendly, professional confirmation message acknowledging their status update. Keep it concise (2-3 sentences).
If there are any issues or concerns with the update, mention them politely.`;

      const response = await axios.post(
        `${this.baseURL}/api/generate`,
        {
          model: this.model,
          prompt,
          stream: false,
        },
        {
          timeout: 30000,
        }
      );

      return response.data.response.trim();
    } catch (error) {
      logger.error('AI response generation error:', error);
      return "Thank you for submitting your status update. Your work has been recorded successfully!";
    }
  }

  async checkStatus(): Promise<boolean> {
    try {
      const response = await axios.get(`${this.baseURL}/api/tags`, {
        timeout: 5000,
      });
      return response.status === 200;
    } catch (error) {
      logger.error('Ollama health check failed:', error);
      return false;
    }
  }
}

export const aiService = new AIService();
