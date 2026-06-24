import nodemailer from 'nodemailer';
import { env } from '../utils/env.js';
import logger from '../utils/logger.js';
import { EmailOptions } from '../types/index.js';

export class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
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

  async sendEmail(options: EmailOptions): Promise<void> {
    try {
      const mailOptions = {
        from: env.DEFAULT_FROM_EMAIL,
        to: options.to,
        subject: options.subject,
        html: options.html,
        attachments: options.attachments || [],
      };

      const info = await this.transporter.sendMail(mailOptions);
      logger.info(`Email sent successfully: ${info.messageId}`);
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

    await this.sendEmail({
      to: email,
      subject: 'Daily Status Reminder - Please Update Your Work Status',
      html,
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

    await this.sendEmail({
      to: email,
      subject: `Monthly Timesheet Report - ${monthName} ${year}`,
      html,
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

    await this.sendEmail({
      to: email,
      subject: 'Welcome to AI Daily Status Assistant',
      html,
    });
  }

  async verifyConnection(): Promise<boolean> {
    try {
      await this.transporter.verify();
      logger.info('Email service connected successfully');
      return true;
    } catch (error) {
      logger.error('Email service connection failed:', error);
      return false;
    }
  }
}

export const emailService = new EmailService();
