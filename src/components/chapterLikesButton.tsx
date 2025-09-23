'use client';

import { useState } from 'react';
import { Heart } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface ChapterLikeButtonProps {
  chapterId: string;
  initialLiked?: boolean;
  initialLikeCount?: number;
  size?: 'sm' | 'md' | 'lg';
  isLoggedIn?: boolean;
  userId?: string;
}

export default function ChapterLikeButton({ 
  chapterId, 
  initialLiked = false, 
  initialLikeCount = 0,
  size = 'md',
  isLoggedIn = false
  
}: ChapterLikeButtonProps) {
  const [liked, setLiked] = useState(initialLiked);
  const [likeCount, setLikeCount] = useState(initialLikeCount);
  const [loading, setLoading] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const router = useRouter();

  // size config
  const sizeConfig = {
    sm: {
      button: 'px-3 py-1.5 text-xs',
      icon: 'w-4 h-4',
      text: 'text-xs font-semibold',
      scale: 'scale-110'
    },
    md: {
      button: 'px-4 py-2 text-sm',
      icon: 'w-5 h-5',
      text: 'text-sm font-semibold',
      scale: 'scale-120'
    },
    lg: {
      button: 'px-5 py-2.5 text-base',
      icon: 'w-6 h-6',
      text: 'text-base font-semibold',
      scale: 'scale-125'
    }
  };

  const config = sizeConfig[size];

  const handleLike = async () => {
    if (!isLoggedIn) {
      alert('Please login first to give a like');
      return;
    }

    setLoading(true);
    setIsAnimating(true);
    
    try {
      const response = await fetch(`/api/chapters/${chapterId}/likes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (response.status === 401) {
        alert('Please login first to give a like');
        router.push('/login');
        return;
      }

      if (!response.ok) {
        throw new Error('Failed to like');
      }

      const data = await response.json();
      setLiked(data.liked);

      // update like count based on whether it's liked or unliked
      setLikeCount(prev => data.liked ? prev + 1 : prev - 1);

      // Reset animation after a short delay
      setTimeout(() => setIsAnimating(false), 600);
    } catch (error) {
      console.error('Chapter like error:', error);
      alert('Failed to like, please try again.');
      setIsAnimating(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleLike}
      disabled={loading}
      className={`
        inline-flex items-center gap-2 rounded-full transition-all duration-300
        ${config.button}
        ${liked 
          ? 'bg-gradient-to-r from-red-50 to-pink-50 border border-red-200 text-red-600 shadow-sm hover:shadow-md' 
          : 'bg-white border border-gray-200 text-gray-600 shadow-sm hover:shadow-md hover:border-gray-300'
        }
        ${loading ? 'opacity-70 cursor-not-allowed' : 'cursor-pointer hover:-translate-y-0.5'}
        ${isAnimating ? 'transform-gpu' : ''}
      `}
      title={isLoggedIn ? (liked ? 'Unlike' : 'Like') : 'Login to give a like'}
    >
      <div className="relative">
        <Heart 
          className={`
            ${config.icon} transition-all duration-300
            ${liked 
              ? 'fill-red-500 text-red-500' 
              : 'text-gray-400 group-hover:text-red-300'
            }
            ${loading ? 'animate-pulse' : ''}
            ${isAnimating && liked ? `transform ${config.scale}` : ''}
          `}
        />
        {isAnimating && liked && (
          <div className="absolute inset-0 animate-ping">
            <Heart className={`${config.icon} fill-red-200 text-red-200 opacity-75`} />
          </div>
        )}
      </div>
      <span className={`
        ${config.text} transition-colors duration-300
        ${liked ? 'text-red-700' : 'text-gray-700'}
        min-w-[1.5em] text-center
      `}>
        {likeCount}
      </span>
    </button>
  );
}
