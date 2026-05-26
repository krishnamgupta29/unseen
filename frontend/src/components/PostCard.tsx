'use client';

import { Heart, MessageCircle, Share, MoreHorizontal, Link as LinkIcon, Flag, Bookmark, Send, X, Loader2, Trash2, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useRef, useEffect, memo } from 'react';
import { useAppContext } from '@/context/AppContext';
import { useRouter } from 'next/navigation';
import { feed, users, comments as commentsApi, messages as messagesApi } from '@/lib/api';
import { getSocket } from '@/lib/socketClient';
import { useAppStore } from '@/lib/store';

function PostCardComponent({ post: initialPost }: { post: any }) {
  const { currentUser } = useAppContext();
  const router = useRouter();
  
  const storePost = useAppStore(state => state.posts[initialPost._id]);
  const post = storePost || initialPost;
  
  const [showComments, setShowComments] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [copied, setCopied] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [comments, setComments] = useState<any[]>([]);
  const [commentsLoaded, setCommentsLoaded] = useState(false);
  const [replyingTo, setReplyingTo] = useState<any>(null);
  
  const isLiked = post.isLiked || false;
  const isSaved = post.isSaved || false;
  const isFollowing = post.author?.isFollowing || false;
  
  const [reportStatus, setReportStatus] = useState<string | null>(null);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [reporting, setReporting] = useState(false);
  
  const [isDeleted, setIsDeleted] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  
  const [following, setFollowing] = useState<any[]>([]);
  const [loadingFollowing, setLoadingFollowing] = useState(false);
  const [sentToUsers, setSentToUsers] = useState<string[]>([]);
  const [shareSearch, setShareSearch] = useState('');

  const menuRef = useRef<HTMLDivElement>(null);
  const shareRef = useRef<HTMLDivElement>(null);
  const commentInputRef = useRef<HTMLInputElement>(null);

  const author = post.author;
  const authorId = author?._id || author?.id || '';
  const isSelf = currentUser?.id === authorId;

  // Initialize post in store on mount
  useEffect(() => {
    if (initialPost && !storePost) {
      useAppStore.getState().setPost(initialPost);
    }
  }, [initialPost, storePost]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) setShowMenu(false);
      if (shareRef.current && !shareRef.current.contains(event.target as Node)) setShowShare(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    
    const socket = getSocket();
    const handlePostDeleted = (data: { postId: string }) => {
      if (data.postId === post._id) {
        setIsDeleted(true);
      }
    };
    
    const handleCommentCreated = (data: { postId: string; comment: any }) => {
      if (data.postId === post._id) {
        setComments(prev => {
          if (prev.some(c => c._id === data.comment._id || (c.isOptimistic && c.content === data.comment.content && c.author._id === data.comment.author._id))) {
            return prev.map(c => (c.isOptimistic && c.content === data.comment.content && c.author._id === data.comment.author._id) ? data.comment : c);
          }
          return [data.comment, ...prev];
        });
        useAppStore.getState().updatePostLocal(post._id, { commentsCount: post.commentsCount + 1 });
      }
    };

    const handleCommentDeleted = (data: { postId: string; commentId: string }) => {
      if (data.postId === post._id) {
        setComments(prev => prev.filter(c => c._id !== data.commentId));
        useAppStore.getState().updatePostLocal(post._id, { commentsCount: Math.max(0, post.commentsCount - 1) });
      }
    };

    socket.on('post:deleted', handlePostDeleted);
    socket.on('comment:created', handleCommentCreated);
    socket.on('comment:deleted', handleCommentDeleted);
    
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      socket.off('post:deleted', handlePostDeleted);
      socket.off('comment:created', handleCommentCreated);
      socket.off('comment:deleted', handleCommentDeleted);
    };
  }, [post._id, post.commentsCount]);

  useEffect(() => {
    if (showShare && currentUser?.id) {
      setLoadingFollowing(true);
      users.getFollowing(currentUser.id)
        .then(data => setFollowing(data))
        .catch(e => console.error(e))
        .finally(() => setLoadingFollowing(false));
    } else {
      setSentToUsers([]);
    }
  }, [showShare, currentUser]);

  const handleSendPost = async (targetUserId: string) => {
    try {
      const msgContent = `[POST_SHARE:${post._id}]`;
      await messagesApi.send(targetUserId, msgContent);
      setSentToUsers(prev => [...prev, targetUserId]);
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeletePost = async () => {
    setDeleting(true);
    try {
      await feed.deletePost(post._id);
      setIsDeleted(true);
      setShowDeleteModal(false);
      useAppStore.getState().removePostLocal(post._id);
    } catch (e) {
      console.error('Failed to delete post', e);
    } finally {
      setDeleting(false);
    }
  };

  const handleShare = () => {
    navigator.clipboard.writeText(`https://unseen-app.com/post/${post._id}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleReportPostClick = () => {
    setShowMenu(false);
    setShowReportModal(true);
  };

  const handleSendReport = async () => {
    if (!reportReason.trim()) return;
    setReporting(true);
    try {
      await users.report(authorId, { reason: reportReason.trim(), contentId: post._id, contentType: 'post' });
      setReportStatus("Whisper has been reported to the moderation systems.");
      setTimeout(() => setReportStatus(null), 4000);
      setShowReportModal(false);
      setReportReason('');
    } catch (e: any) {
      console.error(e);
      setReportStatus(e.message || "Failed to report post.");
      setTimeout(() => setReportStatus(null), 4000);
    } finally {
      setReporting(false);
    }
  };

  useEffect(() => {
    if (showComments && !commentsLoaded) {
      commentsApi.get(post._id).then(data => {
        setComments(data);
        setCommentsLoaded(true);
      }).catch(e => console.error(e));
    }
  }, [showComments, post._id, commentsLoaded]);

  if (isDeleted || !author) return null;

  const handlePostComment = async () => {
    if (!commentText.trim() || !currentUser) return;
    
    const textToSend = commentText.trim();
    const parentId = replyingTo?._id;
    const tempId = `temp-${Date.now()}`;
    
    const optimisticComment = {
      _id: tempId,
      author: {
        _id: currentUser.id,
        username: currentUser.username,
        displayName: currentUser.displayName,
        avatarColor: currentUser.avatarColor,
      },
      post: post._id,
      parentComment: parentId,
      content: textToSend,
      likesCount: 0,
      isLiked: false,
      createdAt: new Date().toISOString(),
      isOptimistic: true,
    };
    
    // Optimistic UI updates
    setComments(prev => [optimisticComment, ...prev]);
    useAppStore.getState().updatePostLocal(post._id, { commentsCount: post.commentsCount + 1 });
    setCommentText('');
    setReplyingTo(null);
    
    try {
      const realComment = await commentsApi.create(post._id, textToSend, parentId);
      setComments(prev => prev.map(c => c._id === tempId ? realComment : c));
    } catch (e) {
      console.error(e);
      setComments(prev => prev.filter(c => c._id !== tempId));
      useAppStore.getState().updatePostLocal(post._id, { commentsCount: Math.max(0, post.commentsCount - 1) });
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    const originalComments = [...comments];
    setComments(prev => prev.filter(c => c._id !== commentId));
    useAppStore.getState().updatePostLocal(post._id, { commentsCount: Math.max(0, post.commentsCount - 1) });
    
    try {
      await commentsApi.delete(commentId);
    } catch (e) {
      console.error(e);
      setComments(originalComments);
      useAppStore.getState().updatePostLocal(post._id, { commentsCount: originalComments.length });
    }
  };

  const toggleCommentLike = async (commentId: string) => {
    setComments(comments.map(c => {
      if (c._id === commentId) {
        return { ...c, isLiked: !c.isLiked, likesCount: c.likesCount + (c.isLiked ? -1 : 1) };
      }
      return c;
    }));
    try {
      await commentsApi.like(commentId);
    } catch (e) {
      console.error(e);
    }
  };

  const toggleLike = async () => {
    await useAppStore.getState().toggleLikePost(post._id);
  };

  const toggleSave = async () => {
    await useAppStore.getState().toggleSavePost(post._id);
  };

  const handleToggleFollow = async () => {
    setShowMenu(false);
    await useAppStore.getState().toggleFollowUser(authorId, currentUser?.id);
  };

  const goToProfile = (userId: string) => {
    if (currentUser?.id === userId) router.push('/profile');
    else router.push(`/profile?id=${userId}`);
  };

  const timeAgo = () => {
    const ms = Date.now() - new Date(post.createdAt).getTime();
    const minutes = Math.floor(ms / 60000);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-6 border-b border-unseen-800/30 hover:bg-unseen-900/10 transition-colors relative"
    >
      {/* Report Status Banner */}
      <AnimatePresence>
        {reportStatus && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-2 left-2 right-2 z-50 glass border border-unseen-700/50 p-3 rounded-xl text-center text-xs text-white bg-[#0f0525]/95 shadow-[0_0_20px_rgba(0,0,0,0.8)]"
          >
            {reportStatus}
          </motion.div>
        )}
      </AnimatePresence>
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center space-x-3 cursor-pointer group" onClick={() => goToProfile(authorId)}>
          <div className="relative flex-shrink-0">
            <div className={`absolute inset-0 rounded-full bg-gradient-to-br ${author.avatarColor || 'from-gray-500 to-gray-700'} blur-md opacity-60`} />
            <div className={`relative w-10 h-10 rounded-full bg-gradient-to-br ${author.avatarColor || 'from-gray-500 to-gray-700'} border-2 border-[#080016]`}>
              {/* Pure colored orb */}
            </div>
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-semibold text-gray-200 group-hover:text-unseen-300 transition-colors">{author.displayName}</span>
              <span className="text-xs text-gray-500">· {timeAgo()}</span>
            </div>
            <div className="flex items-center space-x-2 mt-0.5">
              <span className="text-xs text-gray-600 font-mono">@{author.username}</span>
              {post.moodTag && (
                <>
                  <span className="text-gray-600 text-xs">•</span>
                  <span className="text-xs text-unseen-400 font-medium">#{post.moodTag}</span>
                </>
              )}
            </div>
          </div>
        </div>
        
        {/* 3 Dots Menu */}
        <div className="relative" ref={menuRef}>
          <button 
            onClick={() => setShowMenu(!showMenu)}
            className="text-gray-500 hover:text-unseen-300 transition-colors p-1"
          >
            <MoreHorizontal className="w-5 h-5" />
          </button>
          
          <AnimatePresence>
            {showMenu && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="absolute right-0 top-8 w-48 glass rounded-xl shadow-[0_0_15px_rgba(0,0,0,0.5)] z-10 py-2 border border-unseen-700/50"
              >
                {!isSelf && (
                  <button 
                    onClick={handleToggleFollow}
                    className="w-full text-left px-4 py-3 text-sm text-gray-300 hover:bg-unseen-800 hover:text-white transition-colors"
                  >
                    {isFollowing ? 'Unfollow' : 'Follow'} @{author.username}
                  </button>
                )}
                {isSelf && (
                  <button 
                    onClick={() => { setShowMenu(false); setShowDeleteModal(true); }}
                    className="w-full text-left px-4 py-3 text-sm text-red-400 hover:bg-red-500/10 transition-colors flex items-center"
                  >
                    <Trash2 className="w-4 h-4 mr-2" /> Delete Post
                  </button>
                )}
                <div className="h-px bg-unseen-800/50 my-1" />
                <button 
                  onClick={handleReportPostClick}
                  className="w-full text-left px-4 py-3 text-sm text-red-400 hover:bg-red-500/10 transition-colors flex items-center"
                >
                  <Flag className="w-4 h-4 mr-2" /> Report Post
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <p className="text-gray-200 text-base leading-relaxed mb-6 font-inter whitespace-pre-wrap">
        {post.content}
      </p>

      <div className="flex items-center justify-between text-gray-500 w-full sm:w-4/5 md:w-3/4 pr-2">
        <button 
          onClick={toggleLike}
          className={`flex items-center space-x-1 sm:space-x-2 transition-all active:scale-90 group ${isLiked ? 'text-unseen-400' : 'hover:text-unseen-300'}`}
        >
          <div className="p-1.5 sm:p-2 rounded-full group-hover:bg-unseen-800/50 transition-colors relative">
            <Heart className={`w-5 h-5 ${isLiked ? 'fill-current' : ''}`} />
          </div>
          <span className="text-xs sm:text-sm font-medium">{post.likesCount || 0}</span>
        </button>
        
        <button 
          onClick={() => setShowComments(!showComments)}
          className={`flex items-center space-x-1 sm:space-x-2 transition-all active:scale-90 group ${showComments ? 'text-unseen-300' : 'hover:text-unseen-300'}`}
        >
          <div className="p-1.5 sm:p-2 rounded-full group-hover:bg-unseen-800/50 transition-colors">
            <MessageCircle className="w-5 h-5" />
          </div>
          <span className="text-xs sm:text-sm font-medium">{post.commentsCount || 0}</span>
        </button>

        <div className="relative" ref={shareRef}>
          <button 
            onClick={() => setShowShare(!showShare)}
            className="flex items-center space-x-1 sm:space-x-2 hover:text-blue-400 transition-all active:scale-90 group relative"
          >
            <div className="p-1.5 sm:p-2 rounded-full group-hover:bg-unseen-800/50 transition-colors">
              <Share className="w-5 h-5" />
            </div>
          </button>

          <AnimatePresence>
            {showShare && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                className="absolute right-[-40px] sm:right-auto sm:left-1/2 sm:-translate-x-1/2 bottom-full mb-3 w-[260px] sm:w-72 glass bg-[#0a0216]/90 backdrop-blur-2xl rounded-2xl shadow-[0_0_30px_rgba(123,44,191,0.15)] z-20 overflow-hidden border border-unseen-800/60"
              >
                <div className="px-4 py-3 border-b border-unseen-800/50 flex justify-between items-center bg-unseen-900/20">
                  <span className="text-[10px] sm:text-xs font-bold text-gray-200 uppercase tracking-widest font-poppins">Share Whisper</span>
                </div>
                
                <div className="p-2 sm:p-3">
                  <div className="relative mb-3">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-500" />
                    <input 
                      type="text" 
                      placeholder="Search users..." 
                      value={shareSearch}
                      onChange={(e) => setShareSearch(e.target.value)}
                      className="w-full bg-[#080016]/80 border border-unseen-800/80 rounded-xl pl-8 sm:pl-9 pr-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-unseen-500 transition-colors"
                    />
                  </div>
                  
                  <div className="text-[9px] sm:text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2 px-1">Send via Direct Message</div>
                  <div className="max-h-48 overflow-y-auto px-1 space-y-1 custom-scrollbar">
                    {loadingFollowing ? (
                      <div className="flex justify-center py-4"><Loader2 className="w-4 h-4 animate-spin text-unseen-400" /></div>
                    ) : following.length === 0 ? (
                      <p className="text-[10px] text-gray-500 text-center py-4 italic">No network connections found.</p>
                    ) : (
                      following.filter(u => u.displayName.toLowerCase().includes(shareSearch.toLowerCase()) || u.username.toLowerCase().includes(shareSearch.toLowerCase())).map(u => (
                        <button
                          key={u._id}
                          onClick={() => handleSendPost(u._id)}
                          className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-unseen-800/40 transition-colors text-left group/user active:scale-95"
                        >
                          <div className="flex items-center space-x-2 sm:space-x-3 min-w-0">
                            <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full shrink-0 overflow-hidden relative border border-[#080016] shadow-md">
                              <div className={`absolute inset-0 bg-gradient-to-br ${u.avatarColor || 'from-violet-500 to-purple-900'}`} />
                            </div>
                            <div className="flex flex-col min-w-0">
                              <span className="text-[11px] sm:text-xs text-gray-200 font-semibold truncate group-hover/user:text-white transition-colors">{u.displayName}</span>
                              <span className="text-[8px] sm:text-[9px] text-gray-500 truncate font-mono">@{u.username}</span>
                            </div>
                          </div>
                          <span className={`text-[9px] sm:text-[10px] font-bold px-2 sm:px-3 py-1 rounded-full transition-all ${sentToUsers.includes(u._id) ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-unseen-600 hover:bg-unseen-500 text-white shadow-md'}`}>
                            {sentToUsers.includes(u._id) ? 'Sent' : 'Send'}
                          </span>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <button 
          onClick={toggleSave}
          className={`flex items-center space-x-1 sm:space-x-2 transition-all active:scale-90 group ${isSaved ? 'text-unseen-400' : 'hover:text-unseen-400'}`}
        >
          <div className="p-1.5 sm:p-2 rounded-full group-hover:bg-unseen-800/50 transition-colors">
            <Bookmark className={`w-5 h-5 ${isSaved ? 'fill-current' : ''}`} />
          </div>
        </button>
      </div>

      {/* Comments Section */}
      <AnimatePresence>
        {showComments && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="mt-6 pt-4 border-t border-unseen-800/30">
              <div className="flex items-start space-x-3 mb-6">
                <div className="relative flex-shrink-0">
                  <div className={`absolute inset-0 rounded-full bg-gradient-to-br ${currentUser?.avatarColor || 'from-gray-500 to-gray-700'} blur-md opacity-60`} />
                  <div className={`relative w-8 h-8 rounded-full bg-gradient-to-br ${currentUser?.avatarColor || 'from-gray-500 to-gray-700'} border-2 border-[#080016]`}>
                    {/* Pure colored orb */}
                  </div>
                </div>
                <div className="flex-1 relative">
                  <input
                    ref={commentInputRef}
                    type="text"
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handlePostComment()}
                    placeholder={replyingTo ? `Replying to @${replyingTo.author.username}...` : "Write an anonymous reply..."}
                    className="w-full bg-unseen-900/50 border border-unseen-700/50 rounded-full pl-4 pr-16 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-unseen-400"
                  />
                  {replyingTo && (
                    <button 
                      onClick={() => setReplyingTo(null)}
                      className="absolute right-14 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                  <button 
                    onClick={handlePostComment}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-unseen-400 hover:text-unseen-300 text-sm font-semibold"
                  >
                    Reply
                  </button>
                </div>
              </div>
              <div className="space-y-4 pl-4 border-l border-unseen-800/50 mt-6 max-h-[300px] overflow-y-auto custom-scrollbar pr-2">
                {!commentsLoaded ? (
                  <p className="text-xs text-gray-500 italic flex items-center"><Loader2 className="w-3 h-3 animate-spin mr-2" /> Loading whispers...</p>
                ) : comments.length === 0 ? (
                  <p className="text-xs text-gray-500 italic">No whispers recorded. Be the first to break the silence.</p>
                ) : (
                  comments.map(c => (
                    <div key={c._id} className="flex items-start space-x-3 group">
                      <div className="relative flex-shrink-0 mt-1">
                        <div className={`absolute inset-0 rounded-full bg-gradient-to-br ${c.author.avatarColor} blur-sm opacity-60`} />
                        <div className={`relative w-6 h-6 rounded-full bg-gradient-to-br ${c.author.avatarColor} border-[1.5px] border-[#080016]`} />
                      </div>
                      <div className="flex-1 bg-unseen-900/30 p-3 rounded-2xl rounded-tl-sm border border-unseen-800/30">
                        <div className="flex items-center space-x-2 mb-1">
                          <span className="font-semibold text-gray-200 text-xs">{c.author.displayName}</span>
                          <span className="text-[10px] text-gray-500">· just now</span>
                        </div>
                        <p className="text-gray-300 text-sm font-inter leading-relaxed">{c.content}</p>
                        
                        <div className="flex items-center space-x-4 mt-2">
                          <button 
                            onClick={() => toggleCommentLike(c._id)}
                            className={`flex items-center space-x-1 transition-colors ${c.isLiked ? 'text-unseen-400' : 'text-gray-500 hover:text-unseen-300'}`}
                          >
                            <Heart className={`w-3 h-3 ${c.isLiked ? 'fill-current' : ''}`} />
                            <span className="text-[10px] font-medium">{c.likesCount || 'Like'}</span>
                          </button>
                          <button 
                            onClick={() => { 
                              setReplyingTo(c); 
                              setCommentText(`@${c.author.username} `); 
                              setTimeout(() => commentInputRef.current?.focus(), 50);
                            }}
                            className="text-[10px] font-medium text-gray-500 hover:text-unseen-300 transition-colors"
                          >
                            Reply
                          </button>
                          {currentUser?.id === c.author?._id && (
                            <button 
                              onClick={() => handleDeleteComment(c._id)}
                              className="text-[10px] font-medium text-red-500/80 hover:text-red-400 transition-colors flex items-center gap-0.5"
                            >
                              <Trash2 className="w-3 h-3" /> Delete
                            </button>
                          )}
                        </div>
                        {c.parentComment && (
                          <div className="text-[10px] text-unseen-500 mt-1">Replying to a comment</div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Custom Report Modal */}
      <AnimatePresence>
        {showReportModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowReportModal(false)}
              className="absolute inset-0 bg-black/70 backdrop-blur-md"
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-md glass bg-[#0a0216]/80 border border-unseen-800/60 rounded-3xl p-6 md:p-8 z-10 shadow-[0_0_50px_rgba(157,78,221,0.25)] overflow-hidden text-left"
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-650 via-unseen-500 to-red-650" />
              
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-red-500/10 rounded-xl border border-red-500/20 text-red-400">
                    <Flag className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white font-poppins">Report Whisper</h3>
                    <p className="text-[10px] text-gray-500 font-mono">Flag suspicious or violating content</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowReportModal(false)}
                  className="p-1.5 text-gray-500 hover:text-white transition-colors bg-unseen-900/50 hover:bg-unseen-800/50 rounded-full"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-4">
                <p className="text-xs text-gray-400 font-inter leading-relaxed">
                  Help us keep the void secure. Explain why this anonymous whisper violates Unseen's standards.
                </p>
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 mb-2 uppercase tracking-wider">Reason for Report</label>
                  <textarea
                    value={reportReason}
                    onChange={(e) => setReportReason(e.target.value)}
                    placeholder="Enter violation details (e.g. harassment, illegal content, spam)..."
                    maxLength={240}
                    className="w-full bg-[#080016]/80 border border-unseen-800 rounded-2xl px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-red-500/60 focus:ring-1 focus:ring-red-500/30 transition-all min-h-[120px] resize-none font-inter"
                  />
                </div>
              </div>

              <div className="mt-8 flex gap-3">
                <button
                  onClick={() => setShowReportModal(false)}
                  className="flex-1 py-3 bg-unseen-950 border border-unseen-800/80 hover:bg-unseen-900 rounded-xl text-xs uppercase tracking-wider font-bold text-gray-400 hover:text-white transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSendReport}
                  disabled={reporting || !reportReason.trim()}
                  className="flex-2 py-3 bg-gradient-to-r from-red-650 to-red-800 hover:shadow-[0_0_20px_rgba(239,68,68,0.3)] transition-all rounded-xl text-xs uppercase tracking-wider font-bold text-white flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:shadow-none"
                >
                  {reporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Flag className="w-4 h-4" />}
                  Submit Report
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      
      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowDeleteModal(false)}
              className="absolute inset-0 bg-black/70 backdrop-blur-md"
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-sm glass bg-[#0a0216]/80 border border-unseen-800/60 rounded-3xl p-6 md:p-8 z-10 shadow-[0_0_50px_rgba(239,68,68,0.25)] overflow-hidden text-center"
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-650 via-red-500 to-red-650" />
              <div className="mx-auto w-12 h-12 bg-red-500/10 rounded-full flex items-center justify-center mb-4 border border-red-500/20">
                <Trash2 className="w-6 h-6 text-red-400" />
              </div>
              <h3 className="text-xl font-bold text-white font-poppins mb-2">Delete this post permanently?</h3>
              <p className="text-sm text-gray-400 font-inter leading-relaxed mb-8">
                This whisper will be erased from the void, disappearing from feeds and search results. This action cannot be undone.
              </p>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="flex-1 py-3 bg-unseen-950 border border-unseen-800/80 hover:bg-unseen-900 rounded-xl text-xs uppercase tracking-wider font-bold text-gray-400 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeletePost}
                  disabled={deleting}
                  className="flex-1 py-3 bg-gradient-to-r from-red-650 to-red-800 hover:shadow-[0_0_20px_rgba(239,68,68,0.3)] transition-all rounded-xl text-xs uppercase tracking-wider font-bold text-white flex items-center justify-center gap-2 disabled:opacity-40"
                >
                  {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Delete'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

const PostCard = memo(PostCardComponent);
export default PostCard;
