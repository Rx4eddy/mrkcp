import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { PlatformRegistry } from '../adapters/index.js';
import syncService from '../services/sync.service.js';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth.middleware.js';

const router = Router();

const linkStartSchema = z.object({
  platform: z.string().min(1),
  handle: z.string().min(1),
});

const linkActionSchema = z.object({
  platform: z.string().min(1),
});

router.get('/supported', (_req: Request, res: Response) => {
  const platforms = PlatformRegistry.getSupportedPlatforms();
  res.json(platforms);
});

router.post('/link/start', requireAuth, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const data = linkStartSchema.parse(req.body);
    const result = await syncService.startLinking(req.user!.id, data.platform, data.handle);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

router.post('/link/verify', requireAuth, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const data = linkActionSchema.parse(req.body);
    const result = await syncService.verifyHandle(req.user!.id, data.platform);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

router.post('/sync', requireAuth, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const data = linkActionSchema.parse(req.body);
    const result = await syncService.syncAccount(req.user!.id, data.platform);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

router.post('/sync/all', requireAuth, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const result = await syncService.syncAllAccountsForUser(req.user!.id);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

export default router;
