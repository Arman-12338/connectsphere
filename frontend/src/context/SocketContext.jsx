import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [typingUsers, setTypingUsers] = useState({}); // format: { [chatId]: { [userId]: boolean } }

  const { user } = useAuth();
  const socketUrl = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

  useEffect(() => {
    if (!user) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
      }
      return;
    }

    // Connect to socket server
    const newSocket = io(socketUrl, {
      query: {
        userId: user._id,
      },
      transports: ['websocket'], // force websocket for performance
    });

    setSocket(newSocket);

    // Event listeners
    newSocket.on('connect', () => {
      console.log('Socket client connected:', newSocket.id);
    });

    newSocket.on('getOnlineUsers', (users) => {
      setOnlineUsers(users);
    });

    // Listen for typing events
    newSocket.on('typingStatus', ({ chatId, isTyping, userId }) => {
      setTypingUsers((prev) => {
        const chatTyping = prev[chatId] || {};
        return {
          ...prev,
          [chatId]: {
            ...chatTyping,
            [userId]: isTyping,
          },
        };
      });
    });

    return () => {
      newSocket.disconnect();
    };
  }, [user, socketUrl]);

  const value = {
    socket,
    onlineUsers,
    typingUsers,
  };

  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};
