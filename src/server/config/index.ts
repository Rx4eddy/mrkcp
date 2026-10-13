import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '5000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  appUrl: process.env.APP_URL || 'http://localhost:5173',
  apiUrl: process.env.API_URL || 'http://localhost:5000',
  jwtSecret: process.env.JWT_SECRET || 'fallback-dev-secret-minimum-32-chars-key-mrkcp',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  resendApiKey: process.env.RESEND_API_KEY || '',
  gmail: {
    user: process.env.GMAIL_USER || '',
    appPassword: process.env.GMAIL_APP_PASSWORD || process.env.GMAIL_APP_PASS || '',
  },
  smtp: {
    host: process.env.SMTP_HOST || '',
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    secure: process.env.SMTP_SECURE === 'true',
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
    from: process.env.SMTP_FROM || process.env.RESEND_FROM || 'mrkcp Contests <notifications@mrkcp.dev>',
  },
  contestCronSchedule: process.env.CONTEST_CRON_SCHEDULE || '*/30 * * * *',
  reminderCronSchedule: process.env.REMINDER_CRON_SCHEDULE || '*/5 * * * *',
};

export default config;
