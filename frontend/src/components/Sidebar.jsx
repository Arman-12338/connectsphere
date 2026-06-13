import React, { useState, useEffect } from 'react';
import { useChat } from '../context/ChatContext';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { chatService } from '../services/api';
import { Search, LogOut, Settings, User, MessageSquare, ShieldAlert } from 'lucide-react';

const Sidebar = ({ onOpenProfile }) => {
  const { chats, selectedChat, selectChat, startOrAccessChat, unreadCounts, chatsLoading } = useChat();
  const { user, logout } = useAuth();
  const { onlineUsers, typingUsers } = useSocket();
  
  const [search, setSearch] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  // Search users handler
  useEffect(() => {
    if (!search.trim()) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    const delayDebounce = setTimeout(async () => {
      setIsSearching(true);
      try {
        const response = await chatService.searchUsers(search);
        if (response.data?.success) {
          setSearchResults(response.data.users);
        }
      } catch (err) {
        console.error('User search failed:', err.message);
      } finally {
        setIsSearching(false);
      }
    }, 400);

    return () => clearTimeout(delayDebounce);
  }, [search]);

  const handleUserSelect = async (partnerId) => {
    setSearch('');
    setSearchResults([]);
    await startOrAccessChat(partnerId);
  };

  const getPartnerDetails = (chat) => {
    return chat.participants.find((p) => p._id !== user?._id) || {};
  };

  const isUserOnline = (partnerId) => {
    return onlineUsers.includes(partnerId);
  };

  // Format message time
  const formatMsgTime = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="flex flex-col h-full bg-dark-900 border-r border-white/5 w-full md:max-w-[360px] lg:max-w-[380px] shrink-0 text-dark-100">
      
      {/* 1. Header (User profile, quick links, settings) */}
      <div className="p-4 border-b border-white/5 flex items-center justify-between bg-dark-900/40">
        <div 
          onClick={onOpenProfile}
          className="flex items-center gap-3 cursor-pointer group"
        >
          <div className="relative">
            <img 
              src={user?.avatar} 
              alt="Avatar" 
              className="w-10 h-10 rounded-full object-cover border border-white/10 group-hover:border-primary-500/40 transition-all"
            />
            <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-dark-900" />
          </div>
          <div>
            <h3 className="font-bold text-white text-sm tracking-tight group-hover:text-primary-400 transition-all line-clamp-1">
              {user?.name}
            </h3>
            <span className="text-[10px] font-semibold text-dark-400 uppercase tracking-wider block">My Profile</span>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button 
            onClick={onOpenProfile}
            title="Settings"
            className="p-2 hover:bg-white/5 rounded-full text-dark-300 hover:text-white transition-all"
          >
            <Settings className="w-5 h-5" />
          </button>
          <button 
            onClick={logout}
            title="Log Out"
            className="p-2 hover:bg-red-500/10 rounded-full text-dark-300 hover:text-red-400 transition-all"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* 2. Search Box */}
      <div className="p-4 border-b border-white/5">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search users to chat..."
            className="w-full pl-10 pr-4 py-2 bg-dark-950/80 rounded-xl border border-white/5 text-sm text-white placeholder-dark-500 focus:outline-none focus:border-primary-500/40 transition-all"
          />
        </div>
      </div>

      {/* 3. Search Results Overlay or Chats List */}
      <div className="flex-1 overflow-y-auto">
        {search.trim() ? (
          // --- SEARCH PANEL ---
          <div className="p-2 space-y-1">
            <h4 className="px-3 py-2 text-[10px] font-bold text-dark-400 uppercase tracking-wider">Search Results</h4>
            {isSearching ? (
              <div className="flex items-center justify-center py-8">
                <span className="w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : searchResults.length > 0 ? (
              searchResults.map((searchUser) => (
                <div
                  key={searchUser._id}
                  onClick={() => handleUserSelect(searchUser._id)}
                  className="flex items-center gap-3 p-3 hover:bg-white/5 rounded-2xl cursor-pointer transition-all"
                >
                  <img 
                    src={searchUser.avatar} 
                    alt={searchUser.name} 
                    className="w-10 h-10 rounded-full object-cover border border-white/5"
                  />
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-white text-sm line-clamp-1">{searchUser.name}</h4>
                    <p className="text-xs text-dark-400 line-clamp-1 font-medium">{searchUser.bio}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-dark-400 text-xs flex flex-col items-center justify-center gap-2">
                <ShieldAlert className="w-8 h-8 text-dark-500" />
                <span>No users found for "{search}"</span>
              </div>
            )}
          </div>
        ) : (
          // --- ACTIVE CONVERSATIONS ---
          <div className="p-2 space-y-1">
            <h4 className="px-3 py-2 text-[10px] font-bold text-dark-400 uppercase tracking-wider">Conversations</h4>
            
            {chatsLoading && chats.length === 0 ? (
              // Loading Skeleton
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-2xl animate-shimmer">
                  <div className="w-10 h-10 bg-dark-800 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3.5 bg-dark-800 rounded w-1/3" />
                    <div className="h-2.5 bg-dark-800 rounded w-2/3" />
                  </div>
                </div>
              ))
            ) : chats.length > 0 ? (
              chats.map((chat) => {
                const partner = getPartnerDetails(chat);
                const isOnline = isUserOnline(partner._id);
                const hasUnread = unreadCounts[chat._id] > 0;
                const isSelected = selectedChat?._id === chat._id;
                
                // Typing status checking
                const isPartnerTyping = typingUsers[chat._id]?.[partner._id] === true;

                // Preview message
                const renderPreview = () => {
                  if (isPartnerTyping) {
                    return <span className="text-primary-400 font-semibold animate-pulse-slow">is typing...</span>;
                  }
                  
                  const lastMsg = chat.lastMessage;
                  if (!lastMsg) return 'No messages yet';
                  
                  const prefix = lastMsg.sender === user?._id || lastMsg.sender?._id === user?._id ? 'You: ' : '';
                  if (lastMsg.image) return <span>{prefix}📷 Photo</span>;
                  return lastMsg.message;
                };

                return (
                  <div
                    key={chat._id}
                    onClick={() => selectChat(chat)}
                    className={`flex items-center gap-3 p-3 rounded-2xl cursor-pointer transition-all ${
                      isSelected 
                        ? 'bg-primary-600/15 border border-primary-500/25 text-white' 
                        : 'hover:bg-white/5 border border-transparent'
                    }`}
                  >
                    {/* User Avatar */}
                    <div className="relative shrink-0">
                      <img 
                        src={partner.avatar} 
                        alt={partner.name} 
                        className="w-11 h-11 rounded-full object-cover border border-white/5"
                      />
                      {isOnline && (
                        <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-dark-900" />
                      )}
                    </div>

                    {/* Metadata summary */}
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-baseline mb-0.5">
                        <h4 className={`text-sm font-bold truncate ${isSelected ? 'text-white' : 'text-dark-100'}`}>
                          {partner.name}
                        </h4>
                        <span className="text-[10px] text-dark-400 font-semibold shrink-0">
                          {formatMsgTime(chat.lastMessage?.createdAt || chat.updatedAt)}
                        </span>
                      </div>
                      
                      <div className="flex justify-between items-center gap-1.5">
                        <p className={`text-xs truncate ${hasUnread ? 'text-dark-100 font-bold' : 'text-dark-400'}`}>
                          {renderPreview()}
                        </p>
                        
                        {hasUnread && (
                          <span className="bg-primary-500 text-white font-bold text-[9px] min-w-4.5 h-4.5 flex items-center justify-center px-1 rounded-full shrink-0 shadow-md">
                            {unreadCounts[chat._id]}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-12 text-dark-500 text-xs flex flex-col items-center justify-center gap-2 px-4">
                <MessageSquare className="w-10 h-10 text-dark-600" />
                <span className="font-semibold text-dark-450">No conversations yet</span>
                <p className="text-[10px] text-dark-500">Search users at the top to start a chat</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Sidebar;
