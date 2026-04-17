import { Router } from 'express';
import { z } from 'zod';
import { requireAuth } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { generateDiagrams, chatDiagram } from '../controllers/agentController';

const ChatSchema = z.object({
  message: z.string().min(1).max(4000),
});

const router = Router();

router.use(requireAuth);

// POST /api/projects/:id/generate-diagrams
router.post('/projects/:id/generate-diagrams', generateDiagrams);

// POST /api/diagrams/:id/chat
router.post('/diagrams/:id/chat', validate(ChatSchema), chatDiagram);

export default router;
