import { Router, Request, Response, NextFunction } from 'express';
import contestService from '../services/contest.service.js';

const router = Router();

router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { platform, search, from, to } = req.query;

    const contests = await contestService.getUpcomingContests({
      platform: typeof platform === 'string' ? platform : undefined,
      search: typeof search === 'string' ? search : undefined,
      from: from ? new Date(String(from)) : undefined,
      to: to ? new Date(String(to)) : undefined,
    });

    res.json(contests);
  } catch (err) {
    next(err);
  }
});

router.post('/sync', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await contestService.syncAllContests();
    res.json({
      success: true,
      message: `Contests synced successfully (${result.synced} total).`,
      errors: result.errors,
    });
  } catch (err) {
    next(err);
  }
});

export default router;
