'use client';

import { useState } from 'react';
import { Heart } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface LikeButtonProps {
  projectId: string;
  initialLiked?: boolean;
  initialLikeCount?: number;
  size?: 'sm' | 'md' | 'lg';
  isLoggedIn?: boolean;
  userId?: string;
}

export default function LikeButton({ 
  projectId, 
  initialLiked = false, 
  initialLikeCount = 0,
  size = 'md',
  isLoggedIn = false,
  userId
}: LikeButtonProps) {
  const [liked, setLiked] = useState(initialLiked);
  const [likeCount, setLikeCount] = useState(initialLikeCount);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // size config
  const sizeConfig = {
    sm: {
      button: 'px-2 py-1 text-xs',
      icon: 'w-3 h-3',
      text: 'text-xs'
    },
    md: {
      button: 'px-3 py-2 text-sm',
      icon: 'w-4 h-4',
      text: 'text-sm'
    },
    lg: {
      button: 'px-4 py-2 text-base',
      icon: 'w-5 h-5',
      text: 'text-base'
    }
  };

  const config = sizeConfig[size];

  const handleLike = async () => {
    if (!isLoggedIn) {
      alert('please login first to give a like');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/projects/${projectId}/likes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.status === 401) {
        alert('please login first to give a like');
        router.push('/login');
        return;
      }

      if (!response.ok) {
        throw new Error('give like failed');
      }

      const data = await response.json();
      setLiked(data.liked);
      
      // upodate like count based on whether it's liked or unliked
      setLikeCount(prev => data.liked ? prev + 1 : prev - 1);
    } catch (error) {
      console.error('Like error:', error);
      alert('give like failed, please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleLike}
      disabled={loading}
      className={`
        inline-flex items-center gap-2 rounded-full border transition-all duration-200
        ${config.button}
        ${liked 
          ? 'bg-red-50 border-red-200 text-red-600 hover:bg-red-100' 
          : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
        }
        ${loading ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-md'}
        ${!isLoggedIn ? 'cursor-pointer' : ''}
      `}
      title={isLoggedIn ? (liked ? 'unlike' : 'like') : 'login to give a like'}
    >
      <Heart 
        className={`
          ${config.icon} transition-all duration-200
          ${liked ? 'fill-red-500 text-red-500' : 'text-gray-400'}
          ${loading ? 'animate-pulse' : ''}
        `}
      />
      <span className={`font-medium ${config.text}`}>
        {likeCount}
      </span>
    </button>
  );
}