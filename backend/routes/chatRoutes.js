import express from 'express';
import { accessChat, fetchChats, searchUsers } from '../controllers/chatController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/', protect, accessChat);
router.get('/', protect, fetchChats);
router.get('/users', protect, searchUsers);

export default router;
