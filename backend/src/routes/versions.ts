import { Router } from 'express';
import {
  listVersions,
  getVersion,
  restoreVersion,
} from '../controllers/versionsController';

// mergeParams: true — inherits :id from the parent diagrams router
const router = Router({ mergeParams: true });

router.get('/', listVersions);
router.get('/:versionId', getVersion);
router.post('/:versionId/restore', restoreVersion);

export default router;
