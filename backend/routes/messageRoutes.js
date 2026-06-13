import express from 'express';
import { sendMessage, getMessages, deleteMessage } from '../controllers/messageController.js';
import { protect } from '../middleware/authMiddleware.js';
import { upload } from '../middleware/uploadMiddleware.js';

const router = express.Router();

router.post('/', protect, upload.single('image'), sendMessage);
router.get('/:chatId', protect, getMessages);
router.delete('/:messageId', protect, deleteMessage);

export default router;
