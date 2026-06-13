import React, { useState, useEffect } from 'react';
import { useChat } from '../context/ChatContext';
import { useAuth } from '../context/AuthContext';
import Sidebar from '../components/Sidebar';
import ChatArea from '../components/ChatArea';
import Profile from './Profile';
import ThreeCanvas from '../components/ThreeCanvas';
import GlobeNetwork from '../components/3d/GlobeNetwork';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, ArrowLeft, Heart, Compass } from 'lucide-react';

const Home = () => {
  const { selectedChat, selectChat } = useChat();
  const { user } = useAuth();
  
  const [showProfile, setShowProfile] = useState(false);
  const [mobileActiveTab, setMobileActiveTab] = useState('sidebar'); // 'sidebar' or 'chat'

  // Sync mobile active tab state with selectedChat context state
  useEffect(() => {
    if (selectedChat) {
      setMobileActiveTab('chat');
    } else {
      setMobileActiveTab('sidebar');
    }
  }, [selectedChat]);

  const handleBackToSidebar = () => {
    // Leave room
    selectChat(null);
    setMobileActiveTab('sidebar');
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-dark-950 text-dark-100 font-sans relative">
      
      {/* 3D Canvas Background - Mounted permanently to avoid WebGL context recreation crashes */}
      <div className={`absolute inset-0 z-0 pointer-events-none transition-opacity duration-500 ${selectedChat ? 'opacity-0 invisible' : 'opacity-100 visible'}`}>
        <ThreeCanvas cameraPos={[0, 0, 5]} enableZoom={false} enableRotate={true}>
          <GlobeNetwork />
        </ThreeCanvas>
      </div>

      {/* Profile Settings Modal Overlay */}
      <AnimatePresence>
        {showProfile && (
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 26, stiffness: 220 }}
            className="absolute inset-0 z-40 w-full md:max-w-[380px] h-full shadow-2xl"
          >
            <Profile onClose={() => setShowProfile(false)} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Responsive layout containers */}
      <div className="flex w-full h-full relative z-10">
        
        {/* SIDEBAR PANEL */}
        <div className={`
          ${selectedChat && mobileActiveTab === 'chat' ? 'hidden md:flex' : 'flex'}
          w-full md:w-[360px] lg:w-[380px] h-full shrink-0
        `}>
          <Sidebar onOpenProfile={() => setShowProfile(true)} />
        </div>

        {/* CHAT AREA / 3D HERO PANEL */}
        <div className={`
          ${!selectedChat || mobileActiveTab === 'sidebar' ? 'hidden md:flex' : 'flex'}
          flex-1 h-full min-w-0
        `}>
          {selectedChat ? (
            <ChatArea onToggleSidebar={handleBackToSidebar} />
          ) : (
            // --- 3D HERO LANDING CONTAINER ---
            <div className="relative flex-1 h-full flex flex-col items-center justify-center p-6 text-center select-none overflow-hidden bg-dark-950/20">
              
              {/* Glassmorphic Landing Card */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 15 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
                className="glass-panel max-w-md p-10 rounded-3xl shadow-2xl flex flex-col items-center border border-white/5"
              >
                <motion.div 
                  animate={{ rotate: 360 }}
                  transition={{ duration: 25, repeat: Infinity, ease: 'linear' }}
                  className="w-16 h-16 bg-gradient-to-tr from-primary-600 to-primary-450 rounded-2xl flex items-center justify-center mb-6 text-white shadow-lg shadow-primary-500/10 border border-primary-500/20"
                >
                  <Compass className="w-8 h-8" />
                </motion.div>

                <h2 className="text-2xl font-extrabold text-white font-sans tracking-tight mb-2">
                  Welcome to ConnectSphere, {user?.name}!
                </h2>
                
                <p className="text-xs text-dark-400 font-medium leading-relaxed max-w-sm mt-2">
                  Navigate worldwide connections in real-time. Search for your colleagues in the search bar or select an existing dialogue to start messaging.
                </p>

                <div className="flex items-center gap-2 mt-8 px-4 py-2 bg-dark-900/60 border border-white/5 rounded-full text-[10px] font-bold text-dark-400 tracking-wider uppercase">
                  <MessageSquare className="w-3.5 h-3.5 text-primary-400" />
                  <span>Real-Time Socket Gateway Active</span>
                </div>
              </motion.div>

              {/* Little Footer */}
              <div className="absolute bottom-6 flex items-center gap-1 text-[10px] font-semibold text-dark-500">
                <span>Made with</span>
                <Heart className="w-3 h-3 text-red-500 fill-red-500 animate-pulse" />
                <span>for the Modern Web</span>
              </div>

            </div>
          )}
        </div>

      </div>

    </div>
  );
};

export default Home;
