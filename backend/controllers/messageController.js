import Message from '../models/Message.js';
import Chat from '../models/Chat.js';
import User from '../models/User.js';
import cloudinary from '../config/cloudinary.js';
import fs from 'fs';
import { getReceiverSocketId } from '../sockets/chatSocket.js';

// Helper to upload to Cloudinary and clean up temp local file
const uploadToCloudinary = async (filePath, folder = 'connectsphere/chats') => {
  try {
    const result = await cloudinary.uploader.upload(filePath, {
      folder: folder,
      resource_type: 'image',
    });
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    return result.secure_url;
  } catch (error) {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    throw new Error(`Cloudinary image upload failed: ${error.message}`);
  }
};

// @desc    Send a message (Text and/or Image)
// @route   POST /api/messages
// @access  Private
export const sendMessage = async (req, res) => {
  try {
    const { chatId, message } = req.body;

    if (!chatId) {
      return res.status(400).json({ success: false, message: 'chatId is required' });
    }

    // Check if chat exists
    const chat = await Chat.findById(chatId);
    if (!chat) {
      return res.status(404).json({ success: false, message: 'Chat conversation not found' });
    }

    // Determine receiver (the other participant)
    const receiverId = chat.participants.find(
      (participantId) => participantId.toString() !== req.user._id.toString()
    );

    if (!receiverId) {
      return res.status(400).json({ success: false, message: 'Chat has no other participant' });
    }

    // Check for image attachment
    let imageUrl = '';
    if (req.file) {
      try {
        imageUrl = await uploadToCloudinary(req.file.path);
      } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
      }
    }

    if (!message && !imageUrl) {
      return res.status(400).json({ success: false, message: 'Cannot send an empty message' });
    }

    // Create message
    let newMessage = await Message.create({
      chatId,
      sender: req.user._id,
      receiver: receiverId,
      message: message || '',
      image: imageUrl,
    });

    // Populate details
    newMessage = await newMessage.populate('sender', 'name email avatar bio onlineStatus');
    newMessage = await newMessage.populate('receiver', 'name email avatar bio onlineStatus');

    // Update last message in Chat
    chat.lastMessage = newMessage._id;
    await chat.save();

    // Emit socket event to receiver in real-time
    const receiverSocketId = getReceiverSocketId(receiverId);
    if (receiverSocketId && req.io) {
      req.io.to(receiverSocketId).emit('newMessage', newMessage);
    }

    res.status(201).json({ success: true, message: newMessage });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all messages for a chat
// @route   GET /api/messages/:chatId
// @access  Private
export const getMessages = async (req, res) => {
  try {
    const { chatId } = req.params;

    if (!chatId) {
      return res.status(400).json({ success: false, message: 'chatId parameter is required' });
    }

    // Fetch all messages for the chat where this user hasn't deleted them
    const messages = await Message.find({
      chatId,
      deletedBy: { $ne: req.user._id }
    })
      .populate('sender', 'name email avatar bio onlineStatus')
      .populate('receiver', 'name email avatar bio onlineStatus')
      .sort({ createdAt: 1 });

    res.json({ success: true, messages });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete message for self (adds user ID to deletedBy array)
// @route   DELETE /api/messages/:messageId
// @access  Private
export const deleteMessage = async (req, res) => {
  try {
    const { messageId } = req.params;

    if (!messageId) {
      return res.status(400).json({ success: false, message: 'messageId is required' });
    }

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ success: false, message: 'Message not found' });
    }

    // Add user to deletedBy array if not already present
    if (!message.deletedBy.includes(req.user._id)) {
      message.deletedBy.push(req.user._id);
      await message.save();
    }

    res.json({ success: true, message: 'Message deleted for self successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
