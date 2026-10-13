import { Router, Response, NextFunction } from 'express';
import recommendationService from '../services/recommendation.service.js';
import { optionalAuth, AuthenticatedRequest } from '../middleware/auth.middleware.js';

const router = Router();

router.get('/topics', async (_req, res: Response, next: NextFunction) => {
  try {
    const topics = await recommendationService.getTopics();
    res.json(topics);
  } catch (err) {
    next(err);
  }
});

router.get('/', optionalAuth, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { topic, difficulty, platform, hideSolved } = req.query;

    const result = await recommendationService.getRecommendations(req.user?.id, {
      topic: typeof topic === 'string' ? topic : undefined,
      difficulty: typeof difficulty === 'string' ? difficulty : undefined,
      platform: typeof platform === 'string' ? platform : undefined,
      hideSolved: hideSolved === 'true',
    });

    res.json(result);
  } catch (err) {
    next(err);
  }
});

router.get('/leetcode', optionalAuth, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const result = await recommendationService.getLeetCodeCuratedSet(req.user?.id);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

export default router;
