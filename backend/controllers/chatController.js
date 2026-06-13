import Chat from '../models/Chat.js';
import User from '../models/User.js';

// @desc    Get or create 1-to-1 chat conversation
// @route   POST /api/chats
// @access  Private
export const accessChat = async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ success: false, message: 'UserId param not sent with request' });
    }

    // Check if chat already exists between these two users
    let isChat = await Chat.find({
      participants: { $all: [req.user._id, userId] }
    })
      .populate('participants', '-password')
      .populate('lastMessage');

    isChat = await User.populate(isChat, {
      path: 'lastMessage.sender',
      select: 'name email avatar bio onlineStatus',
    });

    if (isChat.length > 0) {
      res.json({ success: true, chat: isChat[0] });
    } else {
      // Create new chat
      const chatData = {
        participants: [req.user._id, userId],
      };

      const createdChat = await Chat.create(chatData);
      const fullChat = await Chat.findById(createdChat._id).populate('participants', '-password');
      res.status(201).json({ success: true, chat: fullChat });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all active chats for a user
// @route   GET /api/chats
// @access  Private
export const fetchChats = async (req, res) => {
  try {
    let chats = await Chat.find({ participants: { $elemMatch: { $eq: req.user._id } } })
      .populate('participants', '-password')
      .populate('lastMessage')
      .sort({ updatedAt: -1 });

    chats = await User.populate(chats, {
      path: 'lastMessage.sender',
      select: 'name email avatar bio onlineStatus',
    });

    res.json({ success: true, chats });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Search users by name or email
// @route   GET /api/chats/users
// @access  Private
export const searchUsers = async (req, res) => {
  try {
    const keyword = req.query.search
      ? {
          $or: [
            { name: { $regex: req.query.search, $options: 'i' } },
            { email: { $regex: req.query.search, $options: 'i' } },
          ],
        }
      : {};

    // Find all users matching keyword, excluding current user
    const users = await User.find(keyword)
      .find({ _id: { $ne: req.user._id } })
      .select('-password');

    res.json({ success: true, users });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
