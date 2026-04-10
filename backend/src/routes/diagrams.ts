import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import {
  list,
  create,
  getOne,
  update,
  remove,
} from '../controllers/diagramsController';
import { exportMermaid } from '../controllers/versionsController';
import versionsRouter from './versions';
import { z } from 'zod';
import { validate } from '../middleware/validate';

const CreateSchema = z.object({
  name: z.string().min(1).max(255),
  diagram_type: z.enum([
    'architecture',
    'flowchart',
    'erd',
    'class',
    'component',
    'activity',
  ]),
  project_id: z.string().uuid().nullable().optional(),
});

const UpdateSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  flow_data: z.record(z.unknown()).optional(),
  label: z.string().max(255).optional(),
  project_id: z.string().uuid().nullable().optional(),
});

const router = Router();

router.use(requireAuth);

router.get('/', list);
router.post('/', validate(CreateSchema), create);
router.get('/:id', getOne);
router.put('/:id', validate(UpdateSchema), update);
router.delete('/:id', remove);
router.post('/:id/export/mermaid', exportMermaid);

// Nested versions routes — must come after /:id routes
router.use('/:id/versions', versionsRouter);

export default router;
