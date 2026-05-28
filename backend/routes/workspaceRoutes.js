import express from 'express';
import {
  createWorkspace,
  getMyWorkspaces,
  selectWorkspace,
  inviteMember,
  getWorkspaceMembers
} from '../controllers/workspaceController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/', protect, createWorkspace);
router.get('/', protect, getMyWorkspaces);
router.post('/select/:id', protect, selectWorkspace);
router.post('/:id/invite', protect, inviteMember);
router.get('/:id/members', protect, getWorkspaceMembers);

export default router;
