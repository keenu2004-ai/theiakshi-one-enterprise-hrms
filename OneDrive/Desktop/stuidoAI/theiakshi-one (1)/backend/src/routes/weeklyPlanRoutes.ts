import { Router, Request, Response } from 'express';
import { WeeklyPlanValidationService } from '../services/weeklyPlanValidationService';

const router = Router();
const service = new WeeklyPlanValidationService();

router.post('/daily-validation', async (req: Request, res: Response) => {
  try {
    const plans = req.body.plans || req.body.tasks || [];
    const targetDate = req.body.date || new Date().toISOString().slice(0, 10);
    const result = await service.validateWeeklyPlansAndDeductLeaves(plans, targetDate);
    return res.json({
      message: `Daily validation check against weekly plans executed successfully for ${targetDate}.`,
      ...result,
    });
  } catch (err: any) {
    return res.status(500).json({ message: err.message || 'Failed to run daily validation check' });
  }
});

export default router;
