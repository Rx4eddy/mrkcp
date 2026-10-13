import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import prisma from '../db.js';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth.middleware.js';

const router = Router();

const updatePrefSchema = z.object({
  platform: z.string(),
  enabled: z.boolean().optional(),
  morningOf: z.boolean().optional(),
  hoursBefore2: z.boolean().optional(),
});

router.get('/preferences', requireAuth, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const prefs = await prisma.reminderPreference.findMany({
      where: { userId: req.user!.id },
    });
    res.json(prefs);
  } catch (err) {
    next(err);
  }
});

router.put('/preferences', requireAuth, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const data = updatePrefSchema.parse(req.body);

    const updated = await prisma.reminderPreference.upsert({
      where: {
        userId_platform: {
          userId: req.user!.id,
          platform: data.platform.toLowerCase(),
        },
      },
      update: {
        ...(data.enabled !== undefined ? { enabled: data.enabled } : {}),
        ...(data.morningOf !== undefined ? { morningOf: data.morningOf } : {}),
        ...(data.hoursBefore2 !== undefined ? { hoursBefore2: data.hoursBefore2 } : {}),
      },
      create: {
        userId: req.user!.id,
        platform: data.platform.toLowerCase(),
        enabled: data.enabled ?? true,
        morningOf: data.morningOf ?? true,
        hoursBefore2: data.hoursBefore2 ?? true,
      },
    });

    res.json(updated);
  } catch (err) {
    next(err);
  }
});

// Easy 1-click unsubscribe endpoint (supports token or query)
router.post('/unsubscribe', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { token } = req.body;
    if (!token) throw new Error('Unsubscribe token is required');

    let payload: { u: string; p: string };
    try {
      payload = JSON.parse(Buffer.from(token, 'base64').toString('utf8'));
    } catch {
      throw new Error('Invalid unsubscribe token');
    }

    if (!payload.u || !payload.p) {
      throw new Error('Malformed unsubscribe token');
    }

    await prisma.reminderPreference.updateMany({
      where: {
        userId: payload.u,
        platform: payload.p,
      },
      data: {
        enabled: false,
      },
    });

    res.json({
      success: true,
      message: `Successfully unsubscribed from ${payload.p.toUpperCase()} contest reminders.`,
    });
  } catch (err) {
    next(err);
  }
});

export default router;
