import { Request, Response } from 'express';
import { sendChatMessageSchema } from '../utils/validation.js';
import { standupSessionRepository } from '../repositories/standupSession.repository.js';
import { aiService } from '../services/ai.service.js';
import { userRepository } from '../repositories/user.repository.js';
import { dailyStatusRepository } from '../repositories/dailyStatus.repository.js';
import { chatSessionRepository, messageRepository } from '../repositories/chatSession.repository.js';
import { asyncHandler } from '../middlewares/errorHandler.js';
import { NotFoundError } from '../utils/errors.js';
import logger from '../utils/logger.js';

export class ChatController {
  /**
   * Send message in standup conversation
   * Maintains only current session state, no chat history
   */
  sendMessage = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.userId!;
    const { content } = sendChatMessageSchema.parse(req.body);

    // Get or create today's standup session
    const session = await standupSessionRepository.getOrCreateToday(userId);

    // Get user for personalization
    const user = await userRepository.findById(userId);
    if (!user) {
      throw new NotFoundError('User not found');
    }

    // Get or create today's ChatSession for message history
    let chatSession = await chatSessionRepository.findTodaySession(userId);
    if (!chatSession) {
      chatSession = await chatSessionRepository.create({
        userId,
        sessionTitle: `Standup ${new Date().toLocaleDateString()}`
      });
    }

    // Save user message to DB
    await messageRepository.create({
      sessionId: chatSession.id,
      role: 'user',
      content
    });

    // Set AI model based on user preference
    aiService.setModel(user.preferredModel);

    // Get AI response based on current session state
    const aiResult = await aiService.getTeamLeadResponse(
      content,
      {
        stage: session.stage,
        work: session.work,
        hours: session.hours,
        blockers: session.blockers,
        tomorrowPlan: session.tomorrowPlan,
      },
      user.name
    );

    // Extract and save collected data
    if (aiResult.extractedData) {
      await standupSessionRepository.update(session.id, aiResult.extractedData);
    }

    // Move to next stage if indicated
    if (aiResult.nextStage && aiResult.nextStage !== session.stage) {
      await standupSessionRepository.update(session.id, { stage: aiResult.nextStage });
    }

    // Save AI response to DB
    await messageRepository.create({
      sessionId: chatSession.id,
      role: 'assistant',
      content: aiResult.response
    });

    // If session is completed, create timesheet entry
    let entryCreated = false;
    if (aiResult.nextStage === 'COMPLETED' && session.stage !== 'COMPLETED') {
      try {
        const updatedSession = await standupSessionRepository.getToday(userId);
        if (updatedSession && updatedSession.work) {
          // Create daily status (timesheet entry)
          const today = new Date();
          today.setHours(0, 0, 0, 0);

          const entry = await dailyStatusRepository.create({
            userId,
            workDate: today,
            statusText: this.formatStatusText(updatedSession),
            aiSummary: updatedSession.work,
            hours: updatedSession.hours || user.dailyHours,
            workingFlag: true,
          });

          entryCreated = true;
          logger.info(`Timesheet created for ${user.email} - Date: ${today.toISOString()}`);
          
          // Save summary to chat history
          const summary = `📋 **Daily Standup Summary**\n\n**Work Completed:**\n${updatedSession.work || 'Not provided'}\n\n**Hours Worked:** ${updatedSession.hours || 'Not specified'}h\n\n✅ Your timesheet has been recorded!`;

          await messageRepository.create({
            sessionId: chatSession.id,
            role: 'assistant',
            content: summary
          });
        }
      } catch (error: any) {
        if (error.code === 'P2002') {
          logger.warn('Timesheet already exists for today');
        } else {
          logger.error('Timesheet creation error:', error);
        }
      }
    }

    res.json({
      success: true,
      data: {
        sessionId: session.id,
        stage: aiResult.nextStage || session.stage,
        aiResponse: aiResult.response,
        currentData: {
          work: session.work || aiResult.extractedData?.work || '',
          hours: session.hours || aiResult.extractedData?.hours,
          blockers: session.blockers || aiResult.extractedData?.blockers || '',
          tomorrowPlan: session.tomorrowPlan || aiResult.extractedData?.tomorrowPlan || '',
        },
        entryCreated,
      },
      message: aiResult.nextStage === 'COMPLETED' 
        ? 'Your daily standup has been completed and timesheet recorded!'
        : 'Message processed successfully',
    });
  });

  /**
   * Get current standup session
   */
  getSession = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.userId!;

    const session = await standupSessionRepository.getToday(userId);
    if (!session) {
      return res.json({
        success: true,
        data: null,
        message: 'No active standup session for today',
      });
    }

    // Get chat history
    let history = [];
    const chatSession = await chatSessionRepository.findTodaySession(userId);
    if (chatSession) {
      history = await messageRepository.findBySessionId(chatSession.id);
    }

    res.json({
      success: true,
      data: {
        sessionId: session.id,
        stage: session.stage,
        currentData: {
          work: session.work,
          hours: session.hours,
          blockers: session.blockers,
          tomorrowPlan: session.tomorrowPlan,
        },
        history,
      },
      message: 'Standup session retrieved successfully',
    });
  });

  /**
   * Reset standup session (start over)
   */
  resetSession = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.userId!;

    const session = await standupSessionRepository.getToday(userId);
    if (session) {
      await standupSessionRepository.update(session.id, {
        stage: 'GREETING',
        work: '',
        hours: null,
        blockers: '',
        tomorrowPlan: '',
      });

      // Clear chat history
      const chatSession = await chatSessionRepository.findTodaySession(userId);
      if (chatSession) {
        await messageRepository.deleteBySessionId(chatSession.id);
      }

      return res.json({
        success: true,
        message: 'Standup session reset successfully',
      });
    }

    res.status(404).json({
      success: false,
      error: 'No active standup session',
      message: 'No standup session found for today',
    });
  });

  /**
   * Format collected data into readable status text
   */
  private formatStatusText(session: any): string {
    const parts = [];
    
    if (session.work) parts.push(`Work: ${session.work}`);
    if (session.hours) parts.push(`Hours: ${session.hours}`);
    if (session.blockers) parts.push(`Blockers: ${session.blockers}`);
    if (session.tomorrowPlan) parts.push(`Tomorrow: ${session.tomorrowPlan}`);

    return parts.join(' | ');
  }
}

export const chatController = new ChatController();
