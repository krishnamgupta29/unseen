'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X, Heart, Send, MessageCircle, CornerDownRight } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { Post, Comment } from '@/lib/mock-data';
import { useApp } from '@/context/AppContext';

interface CommentsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  post: Post;
}

function CommentItem({ 
  comment, 
  postId,
  onReply,
  isReply = false,
}: { 
  comment: Comment; 
  postId: string;
  onReply: (commentId: string) => void;
  isReply?: boolean;
}) {
  const { likeComment } = useApp();
  const [isLiked, setIsLiked] = useState(comment.isLiked ?? false);
  const [likes, setLikes] = useState(comment.likes);

  const handleLike = () => {
    if (isLiked) {
      setLikes(prev => prev - 1);
    } else {
      setLikes(prev => prev + 1);
    }
    setIsLiked(!isLiked);
    likeComment(postId, comment.id);
  };

  return (
    <motion.div
      className={`py-3 ${isReply ? 'pl-4 border-l-2 border-[#1e3a6e]/20 ml-10' : ''}`}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex gap-3">
        <div className={`${isReply ? 'w-7 h-7' : 'w-9 h-9'} rounded-full bg-gradient-to-br from-[#2a4d8f] to-[#3b5ca8] flex-shrink-0 flex items-center justify-center`}>
          <div className={`${isReply ? 'w-3.5 h-3.5' : 'w-4.5 h-4.5'} rounded-full bg-[#4a7cc9]/40 blur-[2px]`} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="comment-card">
            <p className="text-[#c4d9ff] text-[14px] leading-relaxed whitespace-pre-wrap break-words">
              {comment.content}
            </p>
          </div>
          <div className="flex items-center gap-4 mt-2 px-1">
            <span className="text-[11px] text-[#5a7ab0]">{comment.timestamp}</span>
            <button
              onClick={handleLike}
              className="flex items-center gap-1.5 group"
            >
              <Heart
                className={`w-3.5 h-3.5 transition-all ${
                  isLiked ? 'text-[#7aa2e3] fill-[#7aa2e3] scale-110' : 'text-[#5a7ab0] group-hover:text-[#7aa2e3]'
                }`}
              />
              <span className={`text-[11px] ${isLiked ? 'text-[#7aa2e3]' : 'text-[#5a7ab0]'}`}>
                {likes}
              </span>
            </button>
            {!isReply && (
              <button
                onClick={() => onReply(comment.id)}
                className="flex items-center gap-1.5 text-[11px] text-[#5a7ab0] hover:text-[#7aa2e3] transition-colors"
              >
                <CornerDownRight className="w-3.5 h-3.5" />
                Reply
              </button>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export function CommentsPanel({ isOpen, onClose, post }: CommentsPanelProps) {
  const { getComments, addComment } = useApp();
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const commentsContainerRef = useRef<HTMLDivElement>(null);

  const comments = getComments(post.id);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [isOpen]);

  const handleSubmit = () => {
    if (!newComment.trim() || isSubmitting) return;

    setIsSubmitting(true);
    addComment(post.id, newComment.trim(), replyingTo || undefined);
    setNewComment('');
    setReplyingTo(null);
    setIsSubmitting(false);

    setTimeout(() => {
      if (commentsContainerRef.current) {
        commentsContainerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }, 100);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleReply = (commentId: string) => {
    setReplyingTo(commentId);
    inputRef.current?.focus();
  };

  const parentComments = comments.filter(c => !c.parentId);
  const getReplies = (parentId: string) => comments.filter(c => c.parentId === parentId);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            className="fixed inset-0 z-50 bg-[#0a0f1c]/80 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            className="fixed inset-x-0 bottom-0 z-50 max-h-[90vh] bg-[#0c1526] rounded-t-3xl border-t border-[#1e3a6e]/20 flex flex-col md:inset-x-auto md:left-1/2 md:bottom-auto md:top-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:max-w-lg md:w-full md:rounded-3xl md:border md:max-h-[85vh]"
            initial={{ y: '100%', opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
          >
            <div className="w-10 h-1 bg-[#1e3a6e]/40 rounded-full mx-auto mt-3 md:hidden" />
            
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#1e3a6e]/15">
              <div className="flex items-center gap-3">
                <MessageCircle className="w-5 h-5 text-[#7aa2e3]" />
                <h3 className="font-semibold text-[#e0eaff]">Comments</h3>
                <span className="text-xs text-[#5a7ab0] bg-[#142240]/60 px-2.5 py-1 rounded-full font-medium">
                  {comments.length}
                </span>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-[#1e3a6e]/30 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-[#5a7ab0]" />
              </button>
            </div>

            <div
              ref={commentsContainerRef}
              className="flex-1 overflow-y-auto px-4 py-3 min-h-0 scrollbar-hide"
            >
              {comments.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#1e3a6e]/30 to-[#2a4d8f]/30 flex items-center justify-center mb-5">
                    <MessageCircle className="w-10 h-10 text-[#4a7cc9]/50" />
                  </div>
                  <p className="text-[#a0c4ff] text-sm mb-2 font-medium">No comments yet</p>
                  <p className="text-[#5a7ab0] text-xs max-w-[200px]">
                    Start the conversation. Share what you feel.
                  </p>
                </div>
              ) : (
                <div className="space-y-1">
                  <AnimatePresence mode="popLayout">
                    {parentComments.map((comment, index) => (
                      <div key={comment.id}>
                        <motion.div
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05 }}
                        >
                          <CommentItem 
                            comment={comment} 
                            postId={post.id}
                            onReply={handleReply}
                          />
                        </motion.div>
                        {getReplies(comment.id).map((reply, replyIndex) => (
                          <motion.div
                            key={reply.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: (index * 0.05) + (replyIndex * 0.03) }}
                          >
                            <CommentItem 
                              comment={reply} 
                              postId={post.id}
                              onReply={handleReply}
                              isReply
                            />
                          </motion.div>
                        ))}
                      </div>
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-[#1e3a6e]/15 bg-[#0c1526]/95 backdrop-blur-sm">
              {replyingTo && (
                <motion.div
                  className="flex items-center justify-between mb-3 px-3 py-2 bg-[#142240]/40 rounded-xl"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <span className="text-xs text-[#7aa2e3] flex items-center gap-2">
                    <CornerDownRight className="w-3.5 h-3.5" />
                    Replying to comment
                  </span>
                  <button
                    onClick={() => setReplyingTo(null)}
                    className="text-xs text-[#5a7ab0] hover:text-[#7aa2e3]"
                  >
                    Cancel
                  </button>
                </motion.div>
              )}
              <div className="flex items-end gap-3">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#2a4d8f] to-[#4a7cc9] flex-shrink-0 flex items-center justify-center">
                  <div className="w-4.5 h-4.5 rounded-full bg-white/20 blur-[2px]" />
                </div>
                <div className="flex-1 relative">
                  <textarea
                    ref={inputRef}
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={replyingTo ? "Write a reply..." : "Add a comment..."}
                    className="w-full bg-[#142240]/50 border border-[#1e3a6e]/20 rounded-2xl px-4 py-3 text-sm text-[#e0eaff] placeholder-[#5a7ab0] resize-none focus:outline-none focus:border-[#4a7cc9]/50 transition-colors"
                    rows={1}
                    style={{
                      minHeight: '44px',
                      maxHeight: '120px',
                      lineHeight: '1.5',
                    }}
                    onInput={(e) => {
                      const target = e.target as HTMLTextAreaElement;
                      target.style.height = 'auto';
                      target.style.height = Math.min(target.scrollHeight, 120) + 'px';
                    }}
                  />
                </div>
                <motion.button
                  onClick={handleSubmit}
                  disabled={!newComment.trim() || isSubmitting}
                  className={`p-3 rounded-full transition-all ${
                    newComment.trim()
                      ? 'bg-gradient-to-r from-[#3b5ca8] to-[#4a7cc9] text-white shadow-lg shadow-[#4a7cc9]/20'
                      : 'bg-[#142240]/50 text-[#5a7ab0]'
                  }`}
                  whileTap={{ scale: 0.95 }}
                  whileHover={newComment.trim() ? { scale: 1.05 } : {}}
                >
                  <Send className="w-5 h-5" />
                </motion.button>
              </div>
              <p className="text-[10px] text-[#3b5998] text-center mt-3">
                Your identity stays hidden
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
