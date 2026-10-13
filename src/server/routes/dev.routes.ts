import { Router, Request, Response } from 'express';
import emailService from '../services/email.service.js';
import schedulerService from '../services/scheduler.service.js';

const router = Router();

router.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

router.get('/emails', (_req: Request, res: Response) => {
  const emails = emailService.getDevMailbox();
  res.json({
    total: emails.length,
    emails,
  });
});

router.delete('/emails', (_req: Request, res: Response) => {
  emailService.clearDevMailbox();
  res.json({ success: true, message: 'Dev mailbox cleared' });
});

router.post('/trigger-reminders', async (_req: Request, res: Response) => {
  const result = await schedulerService.checkAndSendReminders();
  res.json({
    success: true,
    result,
  });
});

export default router;
