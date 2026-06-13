import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { User, Mail, Lock, UserPlus, AlertCircle, Camera } from 'lucide-react';
import ThreeCanvas from '../components/ThreeCanvas';
import LogoBubble from '../components/3d/LogoBubble';

const Register = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [avatar, setAvatar] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState('');
  const [validationError, setValidationError] = useState('');
  
  const [pwStrength, setPwStrength] = useState(0); // 0 to 4 scale
  const { register, error: authError, clearError, isLoading, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    clearError();
    if (isAuthenticated) {
      navigate('/home');
    }
  }, [isAuthenticated, navigate]);

  // Compute password strength
  useEffect(() => {
    if (!password) {
      setPwStrength(0);
      return;
    }
    let strength = 0;
    if (password.length >= 6) strength += 1;
    if (/[A-Z]/.test(password)) strength += 1;
    if (/[0-9]/.test(password)) strength += 1;
    if (/[^A-Za-z0-9]/.test(password)) strength += 1;
    setPwStrength(strength);
  }, [password]);

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setValidationError('File size should be less than 5MB.');
        return;
      }
      setAvatar(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setValidationError('');

    if (!name || !email || !password) {
      setValidationError('Please enter all required fields.');
      return;
    }

    if (password.length < 6) {
      setValidationError('Password must be at least 6 characters long.');
      return;
    }

    const formData = new FormData();
    formData.append('name', name);
    formData.append('email', email);
    formData.append('password', password);
    if (avatar) {
      formData.append('avatar', avatar);
    }

    try {
      await register(formData);
      navigate('/home');
    } catch (err) {
      // Handled by AuthContext and displayed as authError
    }
  };

  const strengthLabels = ['Weak', 'Fair', 'Medium', 'Strong'];
  const strengthColors = ['bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-green-500'];

  return (
    <div className="relative flex items-center justify-center min-h-screen w-full bg-dark-950 px-4 py-8 overflow-y-auto">
      {/* 3D Background */}
      <ThreeCanvas cameraPos={[0, 0, 4]}>
        <LogoBubble />
      </ThreeCanvas>

      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="glass-panel z-10 w-full max-w-md p-8 rounded-3xl shadow-2xl my-auto"
      >
        {/* Header */}
        <div className="text-center mb-6">
          <h2 className="text-3xl font-bold text-white tracking-tight font-sans">
            Create Account
          </h2>
          <p className="text-dark-300 text-sm mt-1">
            Join ConnectSphere to start messaging
          </p>
        </div>

        {/* Errors Display */}
        <AnimatePresence mode="wait">
          {(validationError || authError) && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="flex items-start gap-3 p-4 bg-red-500/10 border border-red-500/20 text-red-200 text-sm rounded-xl mb-5 overflow-hidden"
            >
              <AlertCircle className="w-5 h-5 shrink-0 text-red-400" />
              <div>{validationError || authError}</div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Avatar Upload Field */}
          <div className="flex flex-col items-center mb-4">
            <div className="relative group">
              <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-primary-500/30 bg-dark-900/60 flex items-center justify-center cursor-pointer relative shadow-lg">
                {avatarPreview ? (
                  <img src={avatarPreview} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <Camera className="w-8 h-8 text-dark-400" />
                )}
                
                {/* Upload Overlay */}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all">
                  <span className="text-[10px] text-white font-bold tracking-wider uppercase">Change</span>
                </div>
              </div>
              <input
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full rounded-full"
                disabled={isLoading}
              />
            </div>
            <span className="text-xs text-dark-400 mt-2 font-medium">Upload Profile Picture (Optional)</span>
          </div>

          {/* Full Name input */}
          <div className="space-y-1">
            <label className="text-xs text-dark-300 font-semibold uppercase tracking-wider block">
              Full Name
            </label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-400" />
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="John Doe"
                className="w-full pl-12 pr-4 py-2.5 bg-dark-900/50 rounded-xl border border-white/5 text-white placeholder-dark-500 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-all"
                disabled={isLoading}
                required
              />
            </div>
          </div>

          {/* Email input */}
          <div className="space-y-1">
            <label className="text-xs text-dark-300 font-semibold uppercase tracking-wider block">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-400" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="john@example.com"
                className="w-full pl-12 pr-4 py-2.5 bg-dark-900/50 rounded-xl border border-white/5 text-white placeholder-dark-500 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-all"
                disabled={isLoading}
                required
              />
            </div>
          </div>

          {/* Password input */}
          <div className="space-y-1">
            <label className="text-xs text-dark-300 font-semibold uppercase tracking-wider block">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-400" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Min 6 characters"
                className="w-full pl-12 pr-4 py-2.5 bg-dark-900/50 rounded-xl border border-white/5 text-white placeholder-dark-500 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-all"
                disabled={isLoading}
                required
              />
            </div>

            {/* Password strength indicator */}
            {password && (
              <div className="pt-2">
                <div className="flex gap-1 h-1 w-full bg-dark-900 rounded-full overflow-hidden">
                  {[1, 2, 3, 4].map((level) => (
                    <div
                      key={level}
                      className={`h-full flex-1 transition-all duration-300 ${
                        level <= pwStrength ? strengthColors[pwStrength - 1] : 'bg-transparent'
                      }`}
                    />
                  ))}
                </div>
                <div className="flex justify-between items-center mt-1">
                  <span className="text-[10px] text-dark-400">Strength:</span>
                  <span className="text-[10px] font-bold text-dark-300 uppercase tracking-wider">
                    {strengthLabels[pwStrength - 1] || 'Very Weak'}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-500 hover:to-primary-400 text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-[0.99] transition-all shadow-lg shadow-primary-550/20 disabled:opacity-50 disabled:pointer-events-none mt-2"
          >
            {isLoading ? (
              <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <UserPlus className="w-5 h-5" />
                <span>Create Account</span>
              </>
            )}
          </button>
        </form>

        {/* Redirect to login */}
        <p className="text-center text-sm text-dark-300 mt-6">
          Already have an account?{' '}
          <Link
            to="/login"
            className="text-primary-400 hover:text-primary-300 font-bold transition-all"
          >
            Sign In
          </Link>
        </p>
      </motion.div>
    </div>
  );
};

export default Register;
