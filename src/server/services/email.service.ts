import nodemailer from 'nodemailer';
import config from '../config/index.js';
import { UpcomingContest } from '../adapters/base.adapter.js';

export interface DevEmail {
  id: string;
  to: string;
  subject: string;
  html: string;
  sentAt: Date;
  type: 'VERIFICATION' | 'PASSWORD_RESET' | 'REMINDER_MORNING' | 'REMINDER_2H';
  contestName?: string;
}

import axios from 'axios';

class EmailService {
  private transporter: nodemailer.Transporter | null = null;
  private devMailbox: DevEmail[] = [];
  private provider: 'resend' | 'gmail' | 'smtp' | 'mock' = 'mock';

  constructor() {
    if (config.resendApiKey) {
      this.provider = 'resend';
      console.log('[EmailService] Configured live email delivery via Resend API.');
    } else if (config.gmail.user && config.gmail.appPassword) {
      this.provider = 'gmail';
      this.transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: config.gmail.user,
          pass: config.gmail.appPassword,
        },
      });
      console.log(`[EmailService] Configured live email delivery via Gmail (${config.gmail.user}).`);
    } else if (config.smtp.host && config.smtp.user) {
      this.provider = 'smtp';
      this.transporter = nodemailer.createTransport({
        host: config.smtp.host,
        port: config.smtp.port,
        secure: config.smtp.secure,
        auth: {
          user: config.smtp.user,
          pass: config.smtp.pass,
        },
      });
      console.log(`[EmailService] Configured live email delivery via SMTP (${config.smtp.host}).`);
    } else {
      this.provider = 'mock';
      console.log('[EmailService] No live email credentials provided. Running in dev mock mailbox mode.');
    }
  }

  private async dispatch(
    to: string,
    subject: string,
    html: string,
    type: DevEmail['type'],
    contestName?: string
  ): Promise<boolean> {
    const devRecord: DevEmail = {
      id: `mail_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      to,
      subject,
      html,
      sentAt: new Date(),
      type,
      contestName,
    };

    // Always keep latest 50 emails in dev mailbox for history and verification
    this.devMailbox.unshift(devRecord);
    if (this.devMailbox.length > 50) this.devMailbox.pop();

    if (this.provider === 'resend') {
      try {
        const from = config.smtp.from.includes('<') ? config.smtp.from : `mrkcp <${config.smtp.from}>`;
        await axios.post(
          'https://api.resend.com/emails',
          {
            from: from.includes('mrkcp.dev') ? 'onboarding@resend.dev' : from,
            to: [to],
            subject,
            html,
          },
          {
            headers: {
              Authorization: `Bearer ${config.resendApiKey}`,
              'Content-Type': 'application/json',
            },
            timeout: 10000,
          }
        );
        console.log(`[EmailService Resend] Successfully sent live email to ${to}: "${subject}"`);
        return true;
      } catch (error: any) {
        console.error(`[EmailService Resend] Failed to send email to ${to}:`, error.response?.data || error.message);
        return false;
      }
    } else if (this.transporter) {
      try {
        await this.transporter.sendMail({
          from: this.provider === 'gmail' ? config.gmail.user : config.smtp.from,
          to,
          subject,
          html,
        });
        console.log(`[EmailService ${this.provider.toUpperCase()}] Successfully sent live email to ${to}: "${subject}"`);
        return true;
      } catch (error) {
        console.error(`[EmailService ${this.provider.toUpperCase()}] Failed to send email to ${to}:`, error);
        return false;
      }
    } else {
      console.log(`[EmailService DEV] Simulated email to ${to}: "${subject}" (Type: ${type})`);
      return true;
    }
  }

  getDevMailbox(): DevEmail[] {
    return this.devMailbox;
  }

  clearDevMailbox(): void {
    this.devMailbox = [];
  }

  async sendVerificationEmail(to: string, name: string, token: string): Promise<boolean> {
    const verifyUrl = `${config.appUrl}/verify-email?token=${token}`;
    const subject = 'Verify your email address - mrkcp';
    const html = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; background-color: #0b0f19; color: #f3f4f6; border-radius: 8px;">
        <div style="text-align: center; margin-bottom: 24px;">
          <h1 style="color: #3b82f6; margin: 0; font-size: 28px; letter-spacing: -0.5px;">mrkcp</h1>
          <p style="color: #9ca3af; font-size: 14px; margin-top: 4px;">Competitive Programmer's Home Base</p>
        </div>
        <div style="background-color: #111827; border: 1px solid #1f2937; border-radius: 8px; padding: 24px; margin-bottom: 24px;">
          <h2 style="color: #ffffff; font-size: 20px; margin-top: 0;">Welcome, ${name}!</h2>
          <p style="color: #d1d5db; line-height: 1.6;">Thank you for creating an account on mrkcp. Please verify your email address to enable contest reminders and full account features.</p>
          <div style="text-align: center; margin: 32px 0;">
            <a href="${verifyUrl}" style="background-color: #3b82f6; color: #ffffff; padding: 12px 28px; border-radius: 6px; text-decoration: none; font-weight: 600; display: inline-block;">Verify Email Address</a>
          </div>
          <p style="color: #9ca3af; font-size: 12px; margin-top: 24px;">If the button above doesn't work, copy and paste this link into your browser:</p>
          <p style="color: #60a5fa; font-size: 12px; word-break: break-all;">${verifyUrl}</p>
        </div>
        <p style="color: #6b7280; font-size: 12px; text-align: center;">If you did not create this account, you can safely ignore this email.</p>
      </div>
    `;

    return this.dispatch(to, subject, html, 'VERIFICATION');
  }

  async sendPasswordResetEmail(to: string, name: string, token: string): Promise<boolean> {
    const resetUrl = `${config.appUrl}/reset-password?token=${token}`;
    const subject = 'Reset your password - mrkcp';
    const html = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; background-color: #0b0f19; color: #f3f4f6; border-radius: 8px;">
        <div style="text-align: center; margin-bottom: 24px;">
          <h1 style="color: #3b82f6; margin: 0; font-size: 28px;">mrkcp</h1>
        </div>
        <div style="background-color: #111827; border: 1px solid #1f2937; border-radius: 8px; padding: 24px;">
          <h2 style="color: #ffffff; font-size: 20px; margin-top: 0;">Password Reset Request</h2>
          <p style="color: #d1d5db; line-height: 1.6;">Hi ${name}, we received a request to reset your password. Click the button below to set a new password. This link is valid for 1 hour.</p>
          <div style="text-align: center; margin: 32px 0;">
            <a href="${resetUrl}" style="background-color: #3b82f6; color: #ffffff; padding: 12px 28px; border-radius: 6px; text-decoration: none; font-weight: 600; display: inline-block;">Reset Password</a>
          </div>
          <p style="color: #6b7280; font-size: 12px;">Link: ${resetUrl}</p>
        </div>
      </div>
    `;

    return this.dispatch(to, subject, html, 'PASSWORD_RESET');
  }

  async sendMorningReminderEmail(
    to: string,
    name: string,
    contest: { name: string; platform: string; startTime: Date; durationSeconds: number; url: string },
    unsubscribeToken: string
  ): Promise<boolean> {
    const unsubUrl = `${config.appUrl}/profile?tab=reminders&unsub=${unsubscribeToken}`;
    const durationHours = (contest.durationSeconds / 3600).toFixed(1).replace(/\.0$/, '');
    const startTimeUtc = contest.startTime.toUTCString();

    const subject = `[Contest Today] ${contest.name} on ${contest.platform.toUpperCase()}`;
    const html = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; background-color: #0b0f19; color: #f3f4f6; border-radius: 8px;">
        <div style="margin-bottom: 20px;">
          <span style="display: inline-block; padding: 4px 10px; background-color: #1e3a8a; color: #60a5fa; border-radius: 4px; font-size: 12px; font-weight: 600; text-transform: uppercase;">Contest Today</span>
          <h2 style="color: #ffffff; font-size: 22px; margin: 12px 0 6px 0;">${contest.name}</h2>
          <p style="color: #9ca3af; margin: 0; font-size: 14px;">Platform: <strong>${contest.platform.toUpperCase()}</strong></p>
        </div>
        <div style="background-color: #111827; border: 1px solid #1f2937; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
          <p style="margin: 6px 0; color: #d1d5db;"><strong>Start Time (UTC):</strong> ${startTimeUtc}</p>
          <p style="margin: 6px 0; color: #d1d5db;"><strong>Duration:</strong> ${durationHours} hours (${Math.round(contest.durationSeconds / 60)} mins)</p>
          <div style="margin-top: 20px; text-align: center;">
            <a href="${contest.url}" style="background-color: #2563eb; color: #ffffff; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 600; display: inline-block;">Open Contest Page</a>
          </div>
        </div>
        <div style="border-top: 1px solid #1f2937; padding-top: 16px; font-size: 12px; color: #6b7280; text-align: center;">
          <p>You received this email because you opted in to morning contest reminders for ${contest.platform}.</p>
          <a href="${unsubUrl}" style="color: #9ca3af; text-decoration: underline;">Change reminder preferences or unsubscribe</a>
        </div>
      </div>
    `;

    return this.dispatch(to, subject, html, 'REMINDER_MORNING', contest.name);
  }

  async send2HourReminderEmail(
    to: string,
    name: string,
    contest: { name: string; platform: string; startTime: Date; durationSeconds: number; url: string },
    unsubscribeToken: string
  ): Promise<boolean> {
    const unsubUrl = `${config.appUrl}/profile?tab=reminders&unsub=${unsubscribeToken}`;
    const durationHours = (contest.durationSeconds / 3600).toFixed(1).replace(/\.0$/, '');

    const subject = `[Starts in 2 Hours] ${contest.name}`;
    const html = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; background-color: #0b0f19; color: #f3f4f6; border-radius: 8px;">
        <div style="margin-bottom: 20px;">
          <span style="display: inline-block; padding: 4px 10px; background-color: #7f1d1d; color: #f87171; border-radius: 4px; font-size: 12px; font-weight: 700; text-transform: uppercase;">Starting Soon (2 Hours)</span>
          <h2 style="color: #ffffff; font-size: 22px; margin: 12px 0 6px 0;">${contest.name}</h2>
          <p style="color: #9ca3af; margin: 0; font-size: 14px;">Platform: <strong>${contest.platform.toUpperCase()}</strong></p>
        </div>
        <div style="background-color: #111827; border: 1px solid #1f2937; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
          <p style="color: #d1d5db; margin: 6px 0;">Get your editor, templates, and snacks ready! The contest starts in approximately 2 hours.</p>
          <p style="color: #d1d5db; margin: 6px 0;"><strong>Duration:</strong> ${durationHours} hours</p>
          <div style="margin-top: 20px; text-align: center;">
            <a href="${contest.url}" style="background-color: #ef4444; color: #ffffff; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 600; display: inline-block;">Go to Contest</a>
          </div>
        </div>
        <div style="border-top: 1px solid #1f2937; padding-top: 16px; font-size: 12px; color: #6b7280; text-align: center;">
          <p>You received this 2-hour reminder because you opted in on mrkcp.</p>
          <a href="${unsubUrl}" style="color: #9ca3af; text-decoration: underline;">Change reminder preferences or unsubscribe</a>
        </div>
      </div>
    `;

    return this.dispatch(to, subject, html, 'REMINDER_2H', contest.name);
  }
}

export const emailService = new EmailService();
export default emailService;
