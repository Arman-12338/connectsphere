import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useChat } from '../context/ChatContext';
import { Check, CheckCheck, Trash2, X, ZoomIn } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const MessageItem = ({ message }) => {
  const { user } = useAuth();
  const { deleteMessageForSelf } = useChat();
  const [showDeleteBtn, setShowDeleteBtn] = useState(false);
  const [zoomImage, setZoomImage] = useState(false);

  const isMe = message.sender._id === user?._id || message.sender === user?._id;

  // Format message timestamp
  const formatTime = (isoString) => {
    return new Date(isoString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Render checkmark receipts (only for my own messages)
  const renderReceipts = () => {
    if (!isMe) return null;
    
    if (message.status === 'read') {
      return <CheckCheck className="w-3.5 h-3.5 text-primary-400" />;
    } else if (message.status === 'delivered') {
      return <CheckCheck className="w-3.5 h-3.5 text-dark-400" />;
    } else {
      return <Check className="w-3.5 h-3.5 text-dark-400" />;
    }
  };

  return (
    <>
      <div 
        onMouseEnter={() => setShowDeleteBtn(true)}
        onMouseLeave={() => setShowDeleteBtn(false)}
        className={`flex w-full mb-3.5 ${isMe ? 'justify-end' : 'justify-start'}`}
      >
        <div className={`flex items-end gap-2 max-w-[80%] md:max-w-[70%] group`}>
          
          {/* Partner Avatar (only show on incoming) */}
          {!isMe && (
            <img
              src={message.sender?.avatar}
              alt="Avatar"
              className="w-7 h-7 rounded-full object-cover shrink-0 border border-white/5 shadow-sm mb-1"
            />
          )}

          <div className="flex flex-col relative">
            <div
              className={`p-3.5 rounded-3xl relative transition-all shadow-md ${
                isMe
                  ? 'bg-primary-600 text-white rounded-br-none'
                  : 'bg-dark-850 text-dark-100 rounded-bl-none border border-white/5'
              }`}
            >
              {/* Deletion Action Overlay trigger on hover */}
              <AnimatePresence>
                {showDeleteBtn && (
                  <motion.button
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    onClick={() => deleteMessageForSelf(message._id)}
                    title="Delete message for self"
                    className={`absolute -top-3.5 p-1.5 bg-dark-900 border border-white/10 hover:border-red-500/30 text-dark-400 hover:text-red-400 rounded-full transition-all shadow-lg z-10 ${
                      isMe ? '-left-3.5' : '-right-3.5'
                    }`}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </motion.button>
                )}
              </AnimatePresence>

              {/* Message Image attachment */}
              {message.image && (
                <div className="relative rounded-2xl overflow-hidden mb-2 max-w-full cursor-zoom-in group/img">
                  <img
                    src={message.image}
                    alt="Shared Media"
                    className="max-h-60 w-auto object-cover rounded-xl border border-white/5 transition-transform group-hover/img:scale-[1.02]"
                    onClick={() => setZoomImage(true)}
                  />
                  <div 
                    onClick={() => setZoomImage(true)}
                    className="absolute inset-0 bg-black/25 opacity-0 group-hover/img:opacity-100 flex items-center justify-center transition-all"
                  >
                    <ZoomIn className="w-6 h-6 text-white drop-shadow-md" />
                  </div>
                </div>
              )}

              {/* Message Text */}
              {message.message && (
                <p className="text-sm leading-relaxed break-words font-medium whitespace-pre-wrap">
                  {message.message}
                </p>
              )}

              {/* Message Metadata (Time & Receipts) */}
              <div className="flex items-center justify-end gap-1 mt-1 text-[9px] font-semibold text-white/50 select-none">
                <span>{formatTime(message.createdAt)}</span>
                {renderReceipts()}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* High Fidelity Full Image Modal Overlay */}
      <AnimatePresence>
        {zoomImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-4 cursor-zoom-out"
            onClick={() => setZoomImage(false)}
          >
            <button
              onClick={() => setZoomImage(false)}
              className="absolute top-6 right-6 p-2 bg-white/5 hover:bg-white/10 text-white rounded-full transition-all"
            >
              <X className="w-6 h-6" />
            </button>
            <motion.img
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              src={message.image}
              alt="Shared Media Zoom"
              className="max-w-full max-h-[90vh] object-contain rounded-xl shadow-2xl"
              onClick={(e) => e.stopPropagation()} // Prevent closing when clicking image
            />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default MessageItem;
