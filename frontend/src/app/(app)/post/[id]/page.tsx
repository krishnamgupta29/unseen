'use client';

import React, { useState, useEffect } from 'react';
import { Loader2, ArrowLeft } from 'lucide-react';
import Header from '@/components/layout/Header';
import PostCard from '@/components/PostCard';
import { feed } from '@/lib/api';
import { useRouter } from 'next/navigation';

export default function PostPage({ params }: { params: Promise<{ id: string }> | { id: string } }) {
  const router = useRouter();
  const [unwrappedParams, setUnwrappedParams] = useState<{ id: string } | null>(null);
  const [post, setPost] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Safely unwrap params if it is a Promise or a direct object
  useEffect(() => {
    if (params instanceof Promise) {
      params.then(setUnwrappedParams);
    } else {
      setUnwrappedParams(params);
    }
  }, [params]);

  useEffect(() => {
    if (!unwrappedParams?.id) return;
    setLoading(true);
    feed.getPostById(unwrappedParams.id)
      .then((data) => {
        setPost(data);
      })
      .catch((err) => {
        setError(err.message || 'Failed to fetch whisper.');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [unwrappedParams]);

  return (
    <div className="w-full relative min-h-screen pb-24">
      <Header title="Whisper" />
      
      <div className="p-4 border-b border-unseen-800/30 flex items-center space-x-2">
        <button 
          onClick={() => router.back()} 
          className="p-2 rounded-xl text-gray-400 hover:text-white hover:bg-unseen-900/50 transition-all flex items-center space-x-2"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="text-sm font-semibold">Back</span>
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-unseen-400" />
        </div>
      ) : error ? (
        <div className="p-12 text-center text-gray-500">
          <p className="text-sm font-semibold text-gray-200">{error}</p>
          <p className="text-xs mt-1.5 max-w-xs mx-auto text-gray-500 leading-relaxed">
            This whisper might have faded back into the void or has been deleted.
          </p>
        </div>
      ) : post ? (
        <PostCard post={post} />
      ) : null}
    </div>
  );
}
