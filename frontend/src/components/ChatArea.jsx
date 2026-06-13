import React, { useState, useEffect, useRef } from 'react';
import { useChat } from '../context/ChatContext';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import MessageItem from './MessageItem';
import { Send, Image, Smile, X, Circle, ArrowDown, ArrowLeft } from 'lucide-react';
import EmojiPicker from 'emoji-picker-react';
import { motion, AnimatePresence } from 'framer-motion';

const ChatArea = ({ onToggleSidebar }) => {
  const { selectedChat, messages, messagesLoading, sendTextMessage } = useChat();
  const { user } = useAuth();
  const { socket, typingUsers } = useSocket();

  const [text, setText] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [sending, setSending] = useState(false);
  const [showScrollBtn, setShowScrollBtn] = useState(false);

  const messagesEndRef = useRef(null);
  const chatContainerRef = useRef(null);
  const fileInputRef = useRef(null);
  const isTypingRef = useRef(false);
  const typingTimeoutRef = useRef(null);

  const partner = selectedChat?.participants.find((p) => p._id !== user?._id) || {};
  const isOnline = selectedChat?.participants.find((p) => p._id === partner._id)?.onlineStatus;
  const partnerLastSeen = selectedChat?.participants.find((p) => p._id === partner._id)?.lastSeen;

  // Typing status indicating partner is writing
  const isPartnerTyping = typingUsers[selectedChat?._id]?.[partner._id] === true;

  // Scroll to bottom helper
  const scrollToBottom = (behavior = 'smooth') => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  };

  // Trigger scroll on new message or typing changes
  useEffect(() => {
    scrollToBottom('smooth');
  }, [messages, isPartnerTyping]);

  // Handle scroll detection for the "scroll to bottom" bubble button
  const handleScroll = () => {
    if (!chatContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current;
    // Show button if scrolled up more than 300px
    const isScrolledUp = scrollHeight - scrollTop - clientHeight > 300;
    setShowScrollBtn(isScrolledUp);
  };

  // Cleanup typing timeout on chat change
  useEffect(() => {
    setText('');
    setImageFile(null);
    setImagePreview('');
    setShowEmojiPicker(false);
    isTypingRef.current = false;
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
  }, [selectedChat]);

  // Emit typing events to socket server
  const handleTextChange = (e) => {
    const val = e.target.value;
    setText(val);

    if (!socket || !selectedChat) return;

    if (!isTypingRef.current) {
      isTypingRef.current = true;
      socket.emit('typing', {
        chatId: selectedChat._id,
        senderId: user._id,
        receiverId: partner._id,
      });
    }

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

    typingTimeoutRef.current = setTimeout(() => {
      socket.emit('stopTyping', {
        chatId: selectedChat._id,
        senderId: user._id,
        receiverId: partner._id,
      });
      isTypingRef.current = false;
    }, 1500);
  };

  // Image attachment handler
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('File size must be under 5MB');
        return;
      }
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Handle Emoji Selection
  const handleEmojiClick = (emojiData) => {
    setText((prev) => prev + emojiData.emoji);
  };

  // Submit Message handler
  const handleSend = async (e) => {
    e.preventDefault();
    if (!text.trim() && !imageFile) return;

    setSending(true);
    setShowEmojiPicker(false);

    // Stop typing indicator immediately
    if (socket && selectedChat) {
      socket.emit('stopTyping', {
        chatId: selectedChat._id,
        senderId: user._id,
        receiverId: partner._id,
      });
      isTypingRef.current = false;
    }
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

    try {
      await sendTextMessage(text.trim(), imageFile);
      setText('');
      handleRemoveImage();
    } catch (err) {
      alert('Failed to send message. Please try again.');
    } finally {
      setSending(false);
    }
  };

  // Date Divider Grouping Helper
  const groupMessagesByDate = (msgs) => {
    const groups = [];
    let lastDateStr = '';

    msgs.forEach((msg) => {
      const msgDate = new Date(msg.createdAt);
      const dateStr = msgDate.toLocaleDateString([], { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
      
      const todayStr = new Date().toLocaleDateString([], { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toLocaleDateString([], { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
      
      let displayDate = dateStr;
      if (dateStr === todayStr) displayDate = 'Today';
      else if (dateStr === yesterdayStr) displayDate = 'Yesterday';

      if (displayDate !== lastDateStr) {
        groups.push({ type: 'date-divider', content: displayDate, key: `date-${msg._id}` });
        lastDateStr = displayDate;
      }
      groups.push({ type: 'message', content: msg, key: msg._id });
    });

    return groups;
  };

  const formattedGroups = groupMessagesByDate(messages);

  // Format last seen timestamp
  const formatLastSeen = (isoString) => {
    if (!isoString) return 'Offline';
    const date = new Date(isoString);
    const diffMs = new Date() - date;
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'last seen just now';
    if (diffMins < 60) return `last seen ${diffMins}m ago`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `last seen ${diffHours}h ago`;
    
    return `last seen on ${date.toLocaleDateString()}`;
  };

  return (
    <div className="flex flex-col h-full bg-dark-950 flex-1 relative min-w-0">
      
      {/* 1. Header (Active Partner Details) */}
      <div className="p-4 border-b border-white/5 flex items-center justify-between bg-dark-900/40 backdrop-blur-md z-10">
        <div className="flex items-center gap-3 min-w-0">
          {/* Mobile Back/Toggle Button */}
          <button 
            onClick={onToggleSidebar}
            className="md:hidden p-2 hover:bg-white/5 rounded-full text-dark-300 hover:text-white transition-all shrink-0"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          {/* User Avatar */}
          <div className="relative shrink-0">
            <img
              src={partner.avatar}
              alt={partner.name}
              className="w-10 h-10 rounded-full object-cover border border-white/5 shadow-sm"
            />
            {isOnline && (
              <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-dark-950 animate-pulse" />
            )}
          </div>

          <div className="min-w-0">
            <h3 className="font-bold text-white text-sm truncate tracking-tight">{partner.name}</h3>
            <span className="text-[10px] font-semibold text-dark-400 block truncate">
              {isOnline ? (
                <span className="text-green-400 font-bold">Online</span>
              ) : (
                formatLastSeen(partnerLastSeen)
              )}
            </span>
          </div>
        </div>
      </div>

      {/* 2. Messages dialogue feed panel */}
      <div
        ref={chatContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto px-4 md:px-6 py-4 messages-scrollbar space-y-2 relative"
      >
        {messagesLoading ? (
          // Skeletons
          <div className="space-y-6 py-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className={`flex items-start gap-3 max-w-[60%] ${i % 2 === 0 ? '' : 'ml-auto flex-row-reverse'}`}>
                <div className="w-7 h-7 bg-dark-850 rounded-full shrink-0 animate-pulse" />
                <div className="space-y-2">
                  <div className="h-9 bg-dark-850 rounded-2xl w-48 animate-pulse" />
                  <div className="h-2 bg-dark-900 rounded w-1/3 animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        ) : messages.length > 0 ? (
          <>
            {formattedGroups.map((item) => {
              if (item.type === 'date-divider') {
                return (
                  <div key={item.key} className="flex justify-center my-6 select-none">
                    <span className="px-3.5 py-1 bg-dark-900 border border-white/5 rounded-full text-[10px] font-bold text-dark-400 uppercase tracking-widest">
                      {item.content}
                    </span>
                  </div>
                );
              }
              return <MessageItem key={item.key} message={item.content} />;
            })}

            {/* Real-time typing bubble */}
            <AnimatePresence>
              {isPartnerTyping && (
                <motion.div
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 5 }}
                  className="flex items-end gap-2 max-w-[80%] mb-4"
                >
                  <img
                    src={partner.avatar}
                    alt="Avatar"
                    className="w-7 h-7 rounded-full object-cover shrink-0 border border-white/5"
                  />
                  <div className="px-4 py-3 bg-dark-850 text-dark-400 rounded-3xl rounded-bl-none border border-white/5 shadow-md flex items-center gap-1.5">
                    <span className="text-xs font-semibold">typing</span>
                    <span className="flex items-center gap-1 mt-1">
                      <Circle className="w-1.5 h-1.5 fill-primary-400 text-transparent animate-bounce" />
                      <Circle className="w-1.5 h-1.5 fill-primary-400 text-transparent animate-bounce delay-150" />
                      <Circle className="w-1.5 h-1.5 fill-primary-400 text-transparent animate-bounce delay-300" />
                    </span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-dark-500">
            <div className="w-16 h-16 bg-dark-900/60 border border-white/5 rounded-2xl flex items-center justify-center mb-4 text-primary-400 shadow-inner">
              <Smile className="w-8 h-8" />
            </div>
            <h4 className="font-bold text-white text-base">Say Hello to {partner.name}!</h4>
            <p className="text-xs text-dark-400 max-w-xs mt-1">
              Start the conversation by sending a text message or a shared image.
            </p>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Floating Scroll to Bottom button */}
      <AnimatePresence>
        {showScrollBtn && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            onClick={() => scrollToBottom('smooth')}
            className="absolute bottom-24 right-6 p-3 bg-primary-600 hover:bg-primary-500 text-white rounded-full transition-all shadow-xl hover:scale-105 active:scale-95 z-20"
          >
            <ArrowDown className="w-5 h-5" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* 3. Input Message Panel */}
      <div className="p-4 border-t border-white/5 bg-dark-900/20 backdrop-blur-md">
        
        {/* Attachment image preview */}
        <AnimatePresence>
          {imagePreview && (
            <motion.div
              initial={{ opacity: 0, height: 0, y: 10 }}
              animate={{ opacity: 1, height: 'auto', y: 0 }}
              exit={{ opacity: 0, height: 0, y: 10 }}
              className="flex items-center gap-4 p-3 bg-dark-900 rounded-xl mb-3 border border-white/5 overflow-hidden relative"
            >
              <img
                src={imagePreview}
                alt="Upload preview"
                className="w-16 h-16 object-cover rounded-lg border border-white/10"
              />
              <div className="flex-1">
                <span className="text-xs font-semibold text-white block">Selected Image</span>
                <span className="text-[10px] text-dark-400">Ready to send</span>
              </div>
              <button
                onClick={handleRemoveImage}
                className="p-1.5 bg-dark-950 hover:bg-white/5 rounded-full text-dark-300 hover:text-white transition-all border border-white/5"
              >
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Emoji Picker Overlay */}
        <AnimatePresence>
          {showEmojiPicker && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="absolute bottom-20 left-4 z-30 shadow-2xl border border-white/5 rounded-2xl overflow-hidden glass-panel"
            >
              <EmojiPicker 
                onEmojiClick={handleEmojiClick}
                theme="dark" 
                skinTonesDisabled
                searchDisabled
                width={280}
                height={320}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Input Bar Form */}
        <form onSubmit={handleSend} className="flex items-center gap-3">
          {/* Emoji Toggle button */}
          <button
            type="button"
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            className={`p-3 bg-dark-900 border border-white/5 hover:border-white/10 rounded-xl transition-all ${
              showEmojiPicker ? 'text-primary-400' : 'text-dark-300 hover:text-white'
            }`}
          >
            <Smile className="w-5 h-5" />
          </button>

          {/* Photo attachment button */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="p-3 bg-dark-900 border border-white/5 hover:border-white/10 rounded-xl text-dark-300 hover:text-white transition-all shrink-0"
          >
            <Image className="w-5 h-5" />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            className="hidden"
          />

          {/* Text Input */}
          <input
            type="text"
            value={text}
            onChange={handleTextChange}
            placeholder={imageFile ? "Add a caption..." : "Type a message..."}
            className="flex-1 px-4 py-3 bg-dark-950/80 rounded-xl border border-white/5 text-sm text-white placeholder-dark-500 focus:outline-none focus:border-primary-500/40 transition-all min-w-0"
            disabled={sending}
          />

          {/* Send Action button */}
          <button
            type="submit"
            disabled={sending || (!text.trim() && !imageFile)}
            className="p-3 bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-500 hover:to-primary-400 text-white rounded-xl font-bold flex items-center justify-center hover:scale-[1.03] active:scale-[0.97] transition-all shadow-md shadow-primary-550/10 disabled:opacity-50 shrink-0"
          >
            {sending ? (
              <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </button>
        </form>

      </div>

    </div>
  );
};

export default ChatArea;
