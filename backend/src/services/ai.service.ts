import axios from 'axios';
import { env } from '../utils/env.js';
import logger from '../utils/logger.js';

export interface StandupData {
  stage: string;
  work: string;
  hours: number | null;
  blockers: string;
  tomorrowPlan: string;
}

export interface AIResponse {
  response: string;
  nextStage?: string;
  extractedData?: Partial<StandupData>;
}

// Words that mean "yes, I have more tasks"
const YES_WORDS = ['yes', 'yeah', 'yep', 'yup', 'sure', 'add', 'more', 'another', 'ok', 'okay', 'y'];
// Words that mean "no, I'm done"
const NO_WORDS = ['no', 'nope', 'done', "that's it", 'thats it', 'finish', 'finished', 'nothing', 'complete', 'n', 'nah'];

// Known proper-noun / tool capitalisations
const PROPER_NOUNS: [RegExp, string][] = [
  [/\bfigma\b/gi,         'Figma'],
  [/\breact\b/gi,         'React'],
  [/\bnext\.?js\b/gi,     'Next.js'],
  [/\bnode\.?js\b/gi,     'Node.js'],
  [/\btypescript\b/gi,    'TypeScript'],
  [/\bjavascript\b/gi,    'JavaScript'],
  [/\bprisma\b/gi,        'Prisma'],
  [/\bpostgres(ql)?\b/gi, 'PostgreSQL'],
  [/\bapi\b/gi,           'API'],
  [/\bui\b/gi,            'UI'],
  [/\bux\b/gi,            'UX'],
  [/\bpr\b/gi,            'PR'],
  [/\bcrm\b/gi,           'CRM'],
  [/\berp\b/gi,           'ERP'],
  [/\bsql\b/gi,           'SQL'],
  [/\bgit\b/gi,           'Git'],
  [/\bgithub\b/gi,        'GitHub'],
  [/\bjira\b/gi,          'Jira'],
  [/\bslack\b/gi,         'Slack'],
  [/\baws\b/gi,           'AWS'],
  [/\bazure\b/gi,         'Azure'],
  [/\bgcp\b/gi,           'GCP'],
  [/\bdocker\b/gi,        'Docker'],
  [/\brhb\b/gi,           'RHB'],
  [/\brhbpay\b/gi,        'RHBPay'],
];

/**
 * Fast Rule-Based Standup Assistant with Ollama Integration
 * Collects work tasks (multiple) + hours. Rephrases professionally using Ollama if running.
 *
 * Stages:
 *   GREETING → WAITING_FOR_WORK → WAITING_FOR_MORE_TASKS → WAITING_FOR_HOURS → COMPLETED
 */
export class AIService {
  private baseURL: string = env.OLLAMA_BASE_URL;
  private model: string = env.OLLAMA_MODEL;

  // Kept for interface compatibility
  setModel(model: string): void {
    if (['llama3', 'qwen3', 'mistral'].includes(model)) {
      this.model = model;
    }
  }

  /**
   * Rephrase a raw user task into professional past-tense language.
   * e.g. "design figma for RHBPay" → "Designed Figma screens for the RHBPay project"
   */
  private async rephraseWork(raw: string): Promise<string> {
    const text = raw.trim().replace(/^[•\-*]\s*/, ''); // strip any leading bullet
    if (!text) return text;

    try {
      logger.info(`Attempting Ollama rephrase with model: ${this.model}`);
      const prompt = `You are a professional daily standup summary assistant. 
Rephrase the following raw daily work status description into a single concise, professional, past-tense bullet point (e.g., "Implemented login validation" or "Optimized database queries"). 
Do not include any pleasantries, intro, conversational filler, or multiple sentences. Just return the rephrased status line.

Raw status: "${text}"`;

      const response = await axios.post(
        `${this.baseURL}/api/generate`,
        {
          model: this.model,
          prompt,
          stream: false,
        },
        {
          timeout: 4000, // Fast fallback if Ollama is not responding/not installed
        }
      );

      const generated = response.data.response.trim();
      if (generated && generated.length > 3) {
        // Clean leading bullets or quotes if any
        let cleaned = generated.replace(/^[•\-*"\s]+/, '').replace(/"\s*$/, '');
        // Apply proper-noun capitalisation
        for (const [pattern, replacement] of PROPER_NOUNS) {
          cleaned = cleaned.replace(pattern, replacement);
        }
        // Ensure sentence-case
        return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
      }
    } catch (error) {
      logger.warn('Ollama rephrasing failed or timed out. Falling back to rule-based rephraser.', error);
    }

    // Rule-based fallback
    const verbRules: [RegExp, string][] = [
      [/^design(ed|ing)?\s+/i,            'Designed '],
      [/^develop(ed|ing)?\s+/i,           'Developed '],
      [/^implement(ed|ing)?\s+/i,         'Implemented '],
      [/^build(t|ing)?\s+/i,              'Built '],
      [/^create(d|ing)?\s+/i,             'Created '],
      [/^add(ed|ing)?\s+/i,               'Added '],
      [/^fix(ed|ing)?\s+/i,               'Fixed '],
      [/^bug\s*fix\s+/i,                  'Resolved bug in '],
      [/^debug(ged|ging)?\s+/i,           'Debugged '],
      [/^resolv(ed|ing)?\s+/i,            'Resolved '],
      [/^refactor(ed|ing)?\s+/i,          'Refactored '],
      [/^update(d|ing)?\s+/i,             'Updated '],
      [/^upgrad(ed|ing)?\s+/i,            'Upgraded '],
      [/^test(ed|ing)?\s+/i,              'Tested '],
      [/^writ(e|ing|te)\s+/i,             'Wrote '],
      [/^wrote\s+/i,                      'Wrote '],
      [/^review(ed|ing)?\s+/i,            'Reviewed '],
      [/^code\s+review\s+/i,              'Conducted code review for '],
      [/^deploy(ed|ing)?\s+/i,            'Deployed '],
      [/^setup\s+|set\s+up\s+/i,          'Set up '],
      [/^configur(ed|ing)?\s+/i,          'Configured '],
      [/^integrat(ed|ing)?\s+/i,          'Integrated '],
      [/^migrat(ed|ing)?\s+/i,            'Migrated '],
      [/^optimiz(ed|ing)?\s+/i,           'Optimised '],
      [/^analyz(ed|ing)?\s+/i,            'Analysed '],
      [/^research(ed|ing)?\s+/i,          'Researched '],
      [/^document(ed|ing)?\s+/i,          'Documented '],
      [/^meet(ing)?\s+/i,                 'Attended meeting on '],
      [/^attend(ed|ing)?\s+/i,            'Attended '],
      [/^discuss(ed|ing)?\s+/i,           'Discussed '],
      [/^complet(ed|ing)?\s+/i,           'Completed '],
      [/^work(ed|ing)?\s+on\s+/i,         'Worked on '],
      [/^handl(ed|ing)?\s+/i,             'Handled '],
      [/^coordinat(ed|ing)?\s+/i,         'Coordinated '],
      [/^prepar(ed|ing)?\s+/i,            'Prepared '],
      [/^present(ed|ing)?\s+/i,           'Presented '],
      [/^check(ed|ing)?\s+/i,             'Verified '],
      [/^verif(y|ied|ying)?\s+/i,         'Verified '],
      [/^monitor(ed|ing)?\s+/i,           'Monitored '],
      [/^cleanup\s+|clean(ed)?\s+up\s+/i, 'Cleaned up '],
      [/^remov(ed|ing)?\s+/i,             'Removed '],
      [/^delet(ed|ing)?\s+/i,             'Deleted '],
      [/^replac(ed|ing)?\s+/i,            'Replaced '],
      [/^connect(ed|ing)?\s+/i,           'Connected '],
      [/^map(ped|ping)?\s+/i,             'Mapped '],
    ];

    let rephrased = text;
    let matched = false;

    for (const [pattern, replacement] of verbRules) {
      if (pattern.test(text)) {
        rephrased = text.replace(pattern, replacement);
        matched = true;
        break;
      }
    }

    if (!matched) {
      rephrased = `Worked on ${text}`;
    }

    // Apply proper-noun capitalisation
    for (const [pattern, replacement] of PROPER_NOUNS) {
      rephrased = rephrased.replace(pattern, replacement);
    }

    return rephrased.charAt(0).toUpperCase() + rephrased.slice(1);
  }

  /**
   * Get response based on current stage
   */
  async getTeamLeadResponse(
    userMessage: string,
    sessionData: StandupData,
    userName: string = 'there'
  ): Promise<AIResponse> {
    const msg = userMessage.trim();
    const msgLower = msg.toLowerCase();
    const stage = sessionData.stage;

    try {
      // ── GREETING ──────────────────────────────────────────────
      if (stage === 'GREETING') {
        return {
          response: `Hey ${userName}! 👋 What did you work on today?`,
          nextStage: 'WAITING_FOR_WORK',
          extractedData: {},
        };
      }

      // ── WAITING_FOR_WORK (first task) ─────────────────────────
      if (stage === 'WAITING_FOR_WORK') {
        if (!msg || msg.length < 2) {
          return {
            response: `Could you give me a brief description of what you worked on today?`,
            nextStage: 'WAITING_FOR_WORK',
            extractedData: {},
          };
        }
        const professional = await this.rephraseWork(msg);
        return {
          response: `Got it! ✅ Do you want to add more tasks for today? (yes / no)`,
          nextStage: 'WAITING_FOR_MORE_TASKS',
          extractedData: { work: `• ${professional}` },
        };
      }

      // ── WAITING_FOR_MORE_TASKS ────────────────────────────────
      if (stage === 'WAITING_FOR_MORE_TASKS') {
        const isYes = YES_WORDS.some(w => msgLower === w || msgLower.startsWith(w + ' '));
        const isNo  = NO_WORDS.some(w => msgLower === w || msgLower.startsWith(w + ' '));

        if (isYes && !isNo) {
          return {
            response: `Sure! What else did you work on?`,
            nextStage: 'WAITING_FOR_ANOTHER_TASK',
            extractedData: {},
          };
        }

        // User typed a task directly
        if (!isNo && msg.length > 3 && !isYes) {
          const professional = await this.rephraseWork(msg);
          const existingWork = sessionData.work || '';
          const updatedWork = existingWork ? `${existingWork}\n• ${professional}` : `• ${professional}`;
          return {
            response: `Added! 📝 Do you have more tasks to add? (yes / no)`,
            nextStage: 'WAITING_FOR_MORE_TASKS',
            extractedData: { work: updatedWork },
          };
        }

        // User said no — move to hours
        return {
          response: `Great! How many hours did you work today?`,
          nextStage: 'WAITING_FOR_HOURS',
          extractedData: {},
        };
      }

      // ── WAITING_FOR_ANOTHER_TASK ──────────────────────────────
      if (stage === 'WAITING_FOR_ANOTHER_TASK') {
        if (!msg || msg.length < 2) {
          return {
            response: `What else did you work on today?`,
            nextStage: 'WAITING_FOR_ANOTHER_TASK',
            extractedData: {},
          };
        }
        const professional = await this.rephraseWork(msg);
        const existingWork = sessionData.work || '';
        const updatedWork = existingWork ? `${existingWork}\n• ${professional}` : `• ${professional}`;

        return {
          response: `Added! 📝 Do you want to add more tasks? (yes / no)`,
          nextStage: 'WAITING_FOR_MORE_TASKS',
          extractedData: { work: updatedWork },
        };
      }

      // ── WAITING_FOR_HOURS ─────────────────────────────────────
      if (stage === 'WAITING_FOR_HOURS') {
        const hoursMatch = msg.match(/(\d+(\.\d+)?)/);
        const hours = hoursMatch ? parseFloat(hoursMatch[1]) : null;

        if (hours === null || hours <= 0 || hours > 24) {
          return {
            response: `How many hours did you work today? (e.g. type "8")`,
            nextStage: 'WAITING_FOR_HOURS',
            extractedData: {},
          };
        }

        const work = sessionData.work || msg;
        const summary = this.buildSummary(userName, work, hours);

        return {
          response: summary,
          nextStage: 'COMPLETED',
          extractedData: {
            hours,
            blockers: 'None',
            tomorrowPlan: 'TBD',
          },
        };
      }

      // ── COMPLETED ─────────────────────────────────────────────
      if (stage === 'COMPLETED') {
        return {
          response: `✅ Your standup for today is already recorded! See you tomorrow. 😊`,
          nextStage: 'COMPLETED',
          extractedData: {},
        };
      }

      // Default fallback
      return {
        response: `Hey ${userName}! 👋 What did you work on today?`,
        nextStage: 'WAITING_FOR_WORK',
        extractedData: {},
      };

    } catch (error) {
      logger.error('AI response error:', error);
      return {
        response: `Sorry, something went wrong. Please try again!`,
        nextStage: stage,
        extractedData: {},
      };
    }
  }

  /**
   * Build the final daily summary message
   */
  private buildSummary(userName: string, work: string, hours: number): string {
    return `Great, thanks ${userName}! 🎉 Here's your daily summary:\n\n📋 **Daily Standup Summary**\n\n**Work Completed:**\n${work}\n\n**Hours Worked:** ${hours}h\n\n✅ Your timesheet has been recorded! Have a great evening!`;
  }

  /**
   * Always available
   */
  async checkStatus(): Promise<boolean> {
    return true;
  }
}

export const aiService = new AIService();
