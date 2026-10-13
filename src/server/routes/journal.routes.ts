import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import journalService from '../services/journal.service.js';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth.middleware.js';

const router = Router();

const createManualSchema = z.object({
  url: z.string().url('Please provide a valid problem URL'),
  title: z.string().optional(),
  platform: z.string().optional(),
  solvedAt: z.string().optional(),
  difficulty: z.string().optional(),
  rating: z.number().optional(),
  tags: z.array(z.string()).optional(),
  notes: z.string().optional(),
});

const updateEntrySchema = z.object({
  notes: z.string().optional(),
  tags: z.array(z.string()).optional(),
  difficulty: z.string().optional(),
  rating: z.number().optional(),
  title: z.string().optional(),
});

router.get('/', requireAuth, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { platform, topic, difficulty, search, page, limit } = req.query;

    const result = await journalService.getEntries(req.user!.id, {
      platform: typeof platform === 'string' ? platform : undefined,
      topic: typeof topic === 'string' ? topic : undefined,
      difficulty: typeof difficulty === 'string' ? difficulty : undefined,
      search: typeof search === 'string' ? search : undefined,
      page: page ? parseInt(String(page), 10) : 1,
      limit: limit ? parseInt(String(limit), 10) : 20,
    });

    res.json(result);
  } catch (err) {
    next(err);
  }
});

router.get('/analytics', requireAuth, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const analytics = await journalService.getAnalytics(req.user!.id);
    res.json(analytics);
  } catch (err) {
    next(err);
  }
});

router.post('/', requireAuth, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const data = createManualSchema.parse(req.body);
    const entry = await journalService.createManualEntry(req.user!.id, data);
    res.status(201).json(entry);
  } catch (err) {
    next(err);
  }
});

router.put('/:id', requireAuth, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const entryId = String(req.params.id);
    const data = updateEntrySchema.parse(req.body);
    const updated = await journalService.updateEntry(req.user!.id, entryId, data);
    res.json(updated);
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', requireAuth, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const entryId = String(req.params.id);
    const result = await journalService.deleteEntry(req.user!.id, entryId);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

export default router;
