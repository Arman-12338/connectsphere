import User from '../models/User.js';

// Map to store active user connections: userId -> socketId
export const userSocketMap = {}; 

export const getReceiverSocketId = (receiverId) => {
  return userSocketMap[receiverId];
};

export const initSocket = (io) => {
  io.on('connection', async (socket) => {
    const userId = socket.handshake.query.userId;
    
    if (userId && userId !== 'undefined') {
      userSocketMap[userId] = socket.id;
      console.log(`User connected: UserID=${userId}, SocketID=${socket.id}`);
      
      // Update online status in database
      try {
        await User.findByIdAndUpdate(userId, { 
          onlineStatus: true,
          lastSeen: new Date()
        });
        
        // Broadcast online status to all users
        io.emit('getOnlineUsers', Object.keys(userSocketMap));
        io.emit('userStatusChange', { userId, onlineStatus: true });
      } catch (error) {
        console.error('Socket DB update error on connect:', error.message);
      }
    }

    // Join a specific chat room
    socket.on('joinChat', (chatId) => {
      socket.join(chatId);
      console.log(`Socket ${socket.id} joined room ${chatId}`);
    });

    // Leave a specific chat room
    socket.on('leaveChat', (chatId) => {
      socket.leave(chatId);
      console.log(`Socket ${socket.id} left room ${chatId}`);
    });

    // Typing indicators
    socket.on('typing', ({ chatId, senderId, receiverId }) => {
      const receiverSocketId = getReceiverSocketId(receiverId);
      if (receiverSocketId) {
        // Send typing notification directly to receiver
        socket.to(receiverSocketId).emit('typingStatus', { chatId, isTyping: true, userId: senderId });
      }
    });

    socket.on('stopTyping', ({ chatId, senderId, receiverId }) => {
      const receiverSocketId = getReceiverSocketId(receiverId);
      if (receiverSocketId) {
        // Send typing notification directly to receiver
        socket.to(receiverSocketId).emit('typingStatus', { chatId, isTyping: false, userId: senderId });
      }
    });

    // Message read receipts
    socket.on('readMessages', async ({ chatId, senderId, receiverId }) => {
      // senderId: the user who sent the messages originally (whose messages are being read)
      // receiverId: the user who is reading them (the current user)
      const senderSocketId = getReceiverSocketId(senderId);
      if (senderSocketId) {
        socket.to(senderSocketId).emit('messagesRead', { chatId, readBy: receiverId });
      }
    });

    // Disconnect handler
    socket.on('disconnect', async () => {
      if (userId && userId !== 'undefined') {
        console.log(`User disconnected: UserID=${userId}, SocketID=${socket.id}`);
        delete userSocketMap[userId];
        
        // Update online status in database
        try {
          const lastSeenDate = new Date();
          await User.findByIdAndUpdate(userId, { 
            onlineStatus: false,
            lastSeen: lastSeenDate
          });
          
          // Broadcast offline status to all users
          io.emit('getOnlineUsers', Object.keys(userSocketMap));
          io.emit('userStatusChange', { 
            userId, 
            onlineStatus: false, 
            lastSeen: lastSeenDate 
          });
        } catch (error) {
          console.error('Socket DB update error on disconnect:', error.message);
        }
      }
    });
  });
};
