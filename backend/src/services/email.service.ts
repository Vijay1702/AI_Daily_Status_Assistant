import nodemailer from 'nodemailer';
import { env } from '../utils/env.js';
import logger from '../utils/logger.js';
import { EmailOptions } from '../types/index.js';

export class EmailService {
  private transporter: nodemailer.Transporter | null = null;
  private isTestAccount = false;

  constructor() {
    // Initialization is deferred to ensure async createTestAccount can run
  }

  private async getTransporter(): Promise<nodemailer.Transporter> {
    if (this.transporter) return this.transporter;

    if (env.SMTP_USER === 'test@example.com' || !env.SMTP_USER) {
      logger.info('Creating Ethereal test email account...');
      const testAccount = await nodemailer.createTestAccount();
      this.transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass,
        },
      });
      this.isTestAccount = true;
      logger.info(`Ethereal Email connected. User: ${testAccount.user}`);
    } else {
      this.transporter = nodemailer.createTransport({
        host: env.SMTP_HOST,
        port: env.SMTP_PORT,
        secure: env.SMTP_PORT === 465,
        auth: {
          user: env.SMTP_USER,
          pass: env.SMTP_PASS,
        },
      });
    }

    return this.transporter;
  }

  async sendEmail(options: EmailOptions): Promise<void> {
    try {
      const transporter = await this.getTransporter();
      
      const mailOptions = {
        from: env.DEFAULT_FROM_EMAIL,
        to: options.to,
        subject: options.subject,
        html: options.html,
        ...(options.text && { text: options.text }),
        attachments: options.attachments || [],
      };

      const info = await transporter.sendMail(mailOptions);
      logger.info(`Email sent successfully: ${info.messageId}`);
      
      if (this.isTestAccount) {
        logger.info(`📧 Email Preview URL: ${nodemailer.getTestMessageUrl(info)}`);
      }
    } catch (error) {
      logger.error('Error sending email:', error);
      throw error;
    }
  }

  async sendReminderEmail(name: string, email: string): Promise<void> {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Daily Status Reminder</h2>
        <p>Hello <strong>${name}</strong>,</p>
        <p>This is a friendly reminder that you haven't submitted your daily work status yet.</p>
        <p>Please take a moment to update your status before the end of the day. It only takes a few seconds!</p>
        <p>
          <a href="${env.FRONTEND_URL}/chat" style="display: inline-block; background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px;">
            Submit Your Status
          </a>
        </p>
        <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
        <p style="color: #666; font-size: 12px;">
          Regards,<br>
          <strong>AI Daily Status Assistant</strong>
        </p>
      </div>
    `;

    const text = `Hello ${name},\n\nThis is a friendly reminder that you haven't submitted your daily work status yet.\n\nPlease take a moment to update your status here: ${env.FRONTEND_URL}/chat\n\nRegards,\nAI Daily Status Assistant`;

    await this.sendEmail({
      to: email,
      subject: 'Daily Status Reminder - Please Update Your Work Status',
      html,
      text,
    });
  }

  async sendMonthlyReportEmail(
    name: string,
    email: string,
    month: number,
    year: number,
    filePath: string
  ): Promise<void> {
    const monthName = new Date(year, month - 1).toLocaleString('default', { month: 'long' });

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Monthly Timesheet Report</h2>
        <p>Hello <strong>${name}</strong>,</p>
        <p>Your monthly timesheet report for <strong>${monthName} ${year}</strong> is ready.</p>
        <p>Please find the attached Excel file with all your work entries for the month.</p>
        <p>The report includes:</p>
        <ul>
          <li>Daily work status entries</li>
          <li>Hours logged</li>
          <li>Total working days</li>
          <li>Monthly summary statistics</li>
        </ul>
        <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
        <p style="color: #666; font-size: 12px;">
          Regards,<br>
          <strong>AI Daily Status Assistant</strong>
        </p>
      </div>
    `;

    const text = `Hello ${name},\n\nYour monthly timesheet report for ${monthName} ${year} is ready. Please find the attached Excel file containing your logged status updates.\n\nRegards,\nAI Daily Status Assistant`;

    await this.sendEmail({
      to: email,
      subject: `Monthly Timesheet Report - ${monthName} ${year}`,
      html,
      text,
      attachments: [
        {
          filename: `timesheet_${monthName.toLowerCase()}_${year}.xlsx`,
          path: filePath,
        },
      ],
    });
  }

  async sendWelcomeEmail(name: string, email: string): Promise<void> {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Welcome to AI Daily Status Assistant!</h2>
        <p>Hello <strong>${name}</strong>,</p>
        <p>Thank you for registering! Your account has been successfully created.</p>
        <p>You can now start submitting your daily work status through our chat interface. Simply describe what you worked on, and our AI will automatically:</p>
        <ul>
          <li>Understand your work activities</li>
          <li>Create professional timesheet entries</li>
          <li>Generate monthly reports</li>
          <li>Send you reminders</li>
        </ul>
        <p>
          <a href="${env.FRONTEND_URL}/chat" style="display: inline-block; background-color: #28a745; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px;">
            Get Started
          </a>
        </p>
        <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
        <p style="color: #666; font-size: 12px;">
          Regards,<br>
          <strong>AI Daily Status Assistant</strong>
        </p>
      </div>
    `;

    const text = `Hello ${name},\n\nThank you for registering! Your account has been successfully created.\n\nYou can now start submitting your daily status updates via the chat interface here: ${env.FRONTEND_URL}/chat\n\nRegards,\nAI Daily Status Assistant`;

    await this.sendEmail({
      to: email,
      subject: 'Welcome to AI Daily Status Assistant',
      html,
      text,
    });
  }

  async sendFirstLoginEmail(name: string, email: string): Promise<void> {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">New Login Alert</h2>
        <p>Hello <strong>${name}</strong>,</p>
        <p>We noticed that you just logged into the AI Daily Status Assistant for the first time.</p>
        <p>If this was you, there's nothing else you need to do! Have a great day and don't forget to submit your daily reports.</p>
        <p>If this wasn't you, please reset your password immediately.</p>
        <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
        <p style="color: #666; font-size: 12px;">
          Regards,<br>
          <strong>AI Daily Status Assistant Security Team</strong>
        </p>
      </div>
    `;

    const text = `Hello ${name},\n\nWe noticed a new login on your account. If this was you, you can ignore this alert.\n\nRegards,\nAI Daily Status Assistant Security Team`;

    await this.sendEmail({
      to: email,
      subject: 'First Login Alert - AI Daily Status Assistant',
      html,
      text,
    });
  }

  async verifyConnection(): Promise<boolean> {
    try {
      const transporter = await this.getTransporter();
      await transporter.verify();
      logger.info('Email service connected successfully');
      return true;
    } catch (error) {
      logger.error('Email service connection failed:', error);
      return false;
    }
  }
}

export const emailService = new EmailService();
