import { Router } from 'express';
import { z } from 'zod';
import { requireAuth } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { create, list, remove, update } from '../controllers/projectsController';

const ProjectSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().max(2000).optional().nullable(),
});

const router = Router();

router.use(requireAuth);
router.get('/', list);
router.post('/', validate(ProjectSchema), create);
router.put('/:id', validate(ProjectSchema), update);
router.delete('/:id', remove);

export default router;