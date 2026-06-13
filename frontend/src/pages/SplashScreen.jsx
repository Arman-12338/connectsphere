import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import ThreeCanvas from '../components/ThreeCanvas';
import LogoBubble from '../components/3d/LogoBubble';
import { useAuth } from '../context/AuthContext';

const SplashScreen = () => {
  const [progress, setProgress] = useState(0);
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    // Increment loading bar progress
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 4;
      });
    }, 80);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (progress === 100) {
      const delay = setTimeout(() => {
        if (isAuthenticated) {
          navigate('/home');
        } else {
          navigate('/login');
        }
      }, 500);
      return () => clearTimeout(delay);
    }
  }, [progress, isAuthenticated, navigate]);

  return (
    <div className="relative flex flex-col items-center justify-center min-h-screen w-full bg-dark-950 overflow-hidden">
      {/* 3D Background */}
      <ThreeCanvas cameraPos={[0, 0, 4]}>
        <LogoBubble />
      </ThreeCanvas>

      {/* Main Glassmorphic Panel */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
        className="glass-panel z-10 flex flex-col items-center justify-center p-12 rounded-3xl max-w-sm w-full mx-4 shadow-2xl text-center"
      >
        {/* Animated Brand Logo Icon */}
        <motion.div
          animate={{ 
            boxShadow: ["0 0 15px rgba(92, 124, 255, 0.2)", "0 0 35px rgba(92, 124, 255, 0.6)", "0 0 15px rgba(92, 124, 255, 0.2)"],
            borderColor: ["rgba(92,124,255,0.2)", "rgba(92,124,255,0.7)", "rgba(92,124,255,0.2)"]
          }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          className="w-20 h-20 bg-gradient-to-tr from-primary-600 to-primary-400 rounded-2xl flex items-center justify-center mb-6 border border-primary-500/30"
        >
          <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        </motion.div>

        {/* Title */}
        <h1 className="text-3xl font-extrabold tracking-tight text-white mb-2 font-sans bg-clip-text text-transparent bg-gradient-to-r from-white via-dark-100 to-primary-200">
          ConnectSphere
        </h1>
        <p className="text-sm text-dark-300 font-normal tracking-wider uppercase mb-8">
          Next-Gen Chat Experience
        </p>

        {/* Loading Progress Bar */}
        <div className="w-full h-1.5 bg-dark-900 rounded-full overflow-hidden mb-3 border border-white/5">
          <motion.div
            initial={{ width: '0%' }}
            animate={{ width: `${progress}%` }}
            transition={{ ease: 'easeInOut' }}
            className="h-full bg-gradient-to-r from-primary-600 to-primary-400 rounded-full"
          />
        </div>

        {/* Loading Text */}
        <div className="flex justify-between w-full text-xs text-dark-400">
          <span>Initializing assets...</span>
          <span className="font-semibold text-primary-400">{progress}%</span>
        </div>
      </motion.div>

      {/* Footer Branding */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.5 }}
        transition={{ delay: 1, duration: 1 }}
        className="absolute bottom-6 text-center text-xs tracking-widest text-dark-400 uppercase pointer-events-none"
      >
        MERN Stack &bull; Three.js &bull; Socket.IO
      </motion.div>
    </div>
  );
};

export default SplashScreen;
