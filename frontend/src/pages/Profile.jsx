import React, { useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { Camera, ArrowLeft, Save, User, Info, Calendar, Mail } from 'lucide-react';
import { motion } from 'framer-motion';

const Profile = ({ onClose }) => {
  const { user, updateProfile, isLoading } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [avatar, setAvatar] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(user?.avatar || '');
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  
  const fileInputRef = useRef();

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setErrorMsg('File size must be under 5MB');
        return;
      }
      setAvatar(file);
      setAvatarPreview(URL.createObjectURL(file));
      setErrorMsg('');
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSuccessMsg('');
    setErrorMsg('');

    if (!name.trim()) {
      setErrorMsg('Name cannot be empty.');
      return;
    }

    const formData = new FormData();
    formData.append('name', name.trim());
    formData.append('bio', bio.trim());
    if (avatar) {
      formData.append('avatar', avatar);
    }

    try {
      await updateProfile(formData);
      setSuccessMsg('Profile updated successfully!');
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to update profile.');
    }
  };

  // Format Join Date
  const joinDate = user?.createdAt 
    ? new Date(user.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) 
    : 'Recently';

  return (
    <div className="flex flex-col h-full bg-dark-900 w-full text-dark-100 overflow-y-auto">
      {/* Header */}
      <div className="p-4 border-b border-white/5 flex items-center gap-4 bg-dark-900/80 sticky top-0 backdrop-blur-md z-10">
        <button
          onClick={onClose}
          className="p-2 hover:bg-white/5 rounded-full text-dark-300 hover:text-white transition-all"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h2 className="text-xl font-bold text-white">Profile Settings</h2>
          <p className="text-xs text-dark-400">View and update your identity</p>
        </div>
      </div>

      {/* Profile Content */}
      <div className="p-6 max-w-lg mx-auto w-full space-y-8">
        {/* Profile Picture Uploader */}
        <div className="flex flex-col items-center">
          <div 
            onClick={() => fileInputRef.current?.click()}
            className="w-32 h-32 rounded-full overflow-hidden border-4 border-primary-500/20 bg-dark-850 flex items-center justify-center cursor-pointer relative shadow-xl group hover:border-primary-500/40 transition-all"
          >
            {avatarPreview ? (
              <img src={avatarPreview} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <User className="w-12 h-12 text-dark-400" />
            )}
            
            {/* Hover overlay */}
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center transition-all text-white">
              <Camera className="w-6 h-6 mb-1" />
              <span className="text-[10px] font-bold uppercase tracking-wider">Change photo</span>
            </div>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleAvatarChange}
            className="hidden"
            disabled={isLoading}
          />
          <span className="text-xs text-dark-400 mt-3">Supports JPG, PNG, WEBP. Max 5MB.</span>
        </div>

        {/* Status Alerts */}
        {successMsg && (
          <div className="p-3 bg-green-500/10 border border-green-500/25 text-green-300 text-sm rounded-xl text-center">
            {successMsg}
          </div>
        )}
        {errorMsg && (
          <div className="p-3 bg-red-500/10 border border-red-500/25 text-red-300 text-sm rounded-xl text-center">
            {errorMsg}
          </div>
        )}

        {/* Profile Details Form */}
        <form onSubmit={handleSave} className="space-y-5">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-dark-300 uppercase tracking-wider block">
              Display Name
            </label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-400" />
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                className="w-full pl-12 pr-4 py-3 bg-dark-850 rounded-xl border border-white/5 text-white placeholder-dark-500 focus:outline-none focus:border-primary-500/50 transition-all"
                disabled={isLoading}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-dark-300 uppercase tracking-wider block">
              About / Bio
            </label>
            <div className="relative">
              <Info className="absolute left-4 top-4 w-5 h-5 text-dark-400" />
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Say something about yourself..."
                rows="3"
                className="w-full pl-12 pr-4 py-3 bg-dark-850 rounded-xl border border-white/5 text-white placeholder-dark-500 focus:outline-none focus:border-primary-500/50 transition-all resize-none"
                disabled={isLoading}
                maxLength="160"
              />
            </div>
            <div className="text-right text-[10px] text-dark-400 font-semibold">
              {bio.length}/160 characters
            </div>
          </div>

          {/* Action Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-500 hover:to-primary-400 text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-[0.99] transition-all shadow-lg shadow-primary-550/20 disabled:opacity-50"
          >
            {isLoading ? (
              <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <Save className="w-5 h-5" />
                <span>Save Changes</span>
              </>
            )}
          </button>
        </form>

        {/* Read-Only Meta Data Grid */}
        <div className="pt-6 border-t border-white/5 space-y-4">
          <h3 className="text-xs font-bold text-dark-400 uppercase tracking-wider">Account Metadata</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Email */}
            <div className="flex items-center gap-3 p-4 bg-dark-850 rounded-xl border border-white/5">
              <Mail className="w-5 h-5 text-primary-400" />
              <div>
                <span className="text-[10px] font-bold text-dark-400 uppercase block">Email Address</span>
                <span className="text-sm text-white font-medium break-all">{user?.email}</span>
              </div>
            </div>

            {/* Joined Date */}
            <div className="flex items-center gap-3 p-4 bg-dark-850 rounded-xl border border-white/5">
              <Calendar className="w-5 h-5 text-primary-400" />
              <div>
                <span className="text-[10px] font-bold text-dark-400 uppercase block">Joined Date</span>
                <span className="text-sm text-white font-medium">{joinDate}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
