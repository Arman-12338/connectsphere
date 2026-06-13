import React, { createContext, useState, useEffect, useContext, useRef } from 'react';
import { chatService, messageService } from '../services/api';
import { useSocket } from './SocketContext';
import { useAuth } from './AuthContext';

const ChatContext = createContext(null);

export const ChatProvider = ({ children }) => {
  const [chats, setChats] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [chatsLoading, setChatsLoading] = useState(false);
  const [unreadCounts, setUnreadCounts] = useState({}); // format: { [chatId]: count }
  
  const { socket } = useSocket();
  const { user } = useAuth();
  
  const selectedChatRef = useRef(null);

  // Sync selectedChat with a mutable ref to access it in socket listener closures
  useEffect(() => {
    selectedChatRef.current = selectedChat;
  }, [selectedChat]);

  // Load chat conversations initially
  const fetchChats = async () => {
    setChatsLoading(true);
    try {
      const response = await chatService.fetchChats();
      if (response.data?.success) {
        setChats(response.data.chats);
      }
    } catch (err) {
      console.error('Failed to fetch chats:', err.message);
    } finally {
      setChatsLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchChats();
    } else {
      setChats([]);
      setSelectedChat(null);
      setMessages([]);
      setUnreadCounts({});
    }
  }, [user]);

  // Helper to play synthesized chimes
  const playNotificationSound = () => {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      if (audioCtx.state === 'suspended') {
        // AudioContext requires interaction on some browsers
        return;
      }
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, audioCtx.currentTime); // C5
      osc.frequency.exponentialRampToValueAtTime(783.99, audioCtx.currentTime + 0.12); // G5
      
      gain.gain.setValueAtTime(0.12, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.25);
      
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      
      osc.start();
      osc.stop(audioCtx.currentTime + 0.25);
    } catch (e) {
      console.warn('Synthesized chime error:', e.message);
    }
  };

  // Socket listener for new messages, read receipts, and user presence changes
  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (msg) => {
      const currentSelectedChat = selectedChatRef.current;
      
      // If the incoming message belongs to the active chat
      if (currentSelectedChat && currentSelectedChat._id === msg.chatId) {
        setMessages((prev) => [...prev, msg]);
        
        // Mark messages as read by sending notification back to sender
        socket.emit('readMessages', {
          chatId: msg.chatId,
          senderId: msg.sender._id || msg.sender,
          receiverId: user._id
        });
      } else {
        // Message is for a background chat. Increment unread count
        setUnreadCounts((prev) => ({
          ...prev,
          [msg.chatId]: (prev[msg.chatId] || 0) + 1
        }));
        
        // Play alert sound
        playNotificationSound();
      }

      // Re-order active chats and update the preview message
      setChats((prevChats) => {
        const updated = prevChats.map((c) => {
          if (c._id === msg.chatId) {
            return { ...c, lastMessage: msg, updatedAt: new Date().toISOString() };
          }
          return c;
        });
        
        // Move updated chat to the top
        return updated.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
      });
    };

    const handleMessagesRead = ({ chatId, readBy }) => {
      const currentSelectedChat = selectedChatRef.current;
      // If the partner read our messages in the currently open chat, update UI status
      if (currentSelectedChat && currentSelectedChat._id === chatId) {
        setMessages((prev) =>
          prev.map((msg) => {
            if (msg.sender._id === user._id || msg.sender === user._id) {
              return { ...msg, status: 'read' };
            }
            return msg;
          })
        );
      }
    };

    const handleUserStatusChange = ({ userId, onlineStatus, lastSeen }) => {
      // Update onlineStatus of user across all loaded chats
      setChats((prev) =>
        prev.map((c) => {
          const updatedParticipants = c.participants.map((p) => {
            if (p._id === userId) {
              return { ...p, onlineStatus, lastSeen: lastSeen || new Date().toISOString() };
            }
            return p;
          });
          return { ...c, participants: updatedParticipants };
        })
      );

      // Also update selected chat details if open
      setSelectedChat((prev) => {
        if (!prev) return null;
        const updatedParticipants = prev.participants.map((p) => {
          if (p._id === userId) {
            return { ...p, onlineStatus, lastSeen: lastSeen || new Date().toISOString() };
          }
          return p;
        });
        return { ...prev, participants: updatedParticipants };
      });
    };

    socket.on('newMessage', handleNewMessage);
    socket.on('messagesRead', handleMessagesRead);
    socket.on('userStatusChange', handleUserStatusChange);

    return () => {
      socket.off('newMessage', handleNewMessage);
      socket.off('messagesRead', handleMessagesRead);
      socket.off('userStatusChange', handleUserStatusChange);
    };
  }, [socket, user]);

  const selectChat = async (chat) => {
    // Leave previous chat socket room
    if (selectedChat && socket) {
      socket.emit('leaveChat', selectedChat._id);
    }
    
    setSelectedChat(chat);
    
    if (!chat) {
      setMessages([]);
      return;
    }
    
    setMessagesLoading(true);
    
    // Clear unread counts for this chat
    setUnreadCounts((prev) => ({
      ...prev,
      [chat._id]: 0
    }));

    try {
      const response = await messageService.fetchMessages(chat._id);
      if (response.data?.success) {
        setMessages(response.data.messages);
        
        // Join socket room
        if (socket) {
          socket.emit('joinChat', chat._id);
          
          // Determine the other participant
          const partner = chat.participants.find((p) => p._id !== user._id);
          if (partner) {
            // Tell the sender that all their messages are read
            socket.emit('readMessages', {
              chatId: chat._id,
              senderId: partner._id,
              receiverId: user._id,
            });
          }
        }
      }
    } catch (err) {
      console.error('Failed to load messages:', err.message);
    } finally {
      setMessagesLoading(false);
    }
  };

  const startOrAccessChat = async (partnerId) => {
    try {
      const response = await chatService.accessChat(partnerId);
      if (response.data?.success) {
        const chat = response.data.chat;
        
        // Add to chat list if not already present
        setChats((prev) => {
          if (!prev.some((c) => c._id === chat._id)) {
            return [chat, ...prev];
          }
          return prev;
        });

        // Select it
        await selectChat(chat);
        return chat;
      }
    } catch (err) {
      console.error('Failed to create/access chat:', err.message);
    }
  };

  const sendTextMessage = async (text, file) => {
    if (!selectedChat) return;

    const formData = new FormData();
    formData.append('chatId', selectedChat._id);
    if (text) formData.append('message', text);
    if (file) formData.append('image', file);

    try {
      const response = await messageService.sendMessage(formData);
      if (response.data?.success) {
        const sentMsg = response.data.message;
        setMessages((prev) => [...prev, sentMsg]);

        // Reorder chats list and set preview
        setChats((prevChats) => {
          const updated = prevChats.map((c) => {
            if (c._id === selectedChat._id) {
              return { ...c, lastMessage: sentMsg, updatedAt: new Date().toISOString() };
            }
            return c;
          });
          return updated.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
        });

        return sentMsg;
      }
    } catch (err) {
      console.error('Failed to send message:', err.message);
      throw err;
    }
  };

  const deleteMessageForSelf = async (messageId) => {
    try {
      const response = await messageService.deleteMessage(messageId);
      if (response.data?.success) {
        // Remove locally from state list
        setMessages((prev) => prev.filter((m) => m._id !== messageId));
        return true;
      }
    } catch (err) {
      console.error('Failed to delete message:', err.message);
    }
    return false;
  };

  const value = {
    chats,
    selectedChat,
    messages,
    messagesLoading,
    chatsLoading,
    unreadCounts,
    selectChat,
    startOrAccessChat,
    sendTextMessage,
    deleteMessageForSelf,
    fetchChats,
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
};

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};
