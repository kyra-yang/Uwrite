'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import LikeButton from '@/components/projectLikesButton';
import { MessageCircle } from 'lucide-react';

interface Project {
  id: string;
  title: string;
  synopsis: string;
  createdAt: string;
  updatedAt: string;
  owner: {
    id: string;
    name: string;
  };
  chapterCount: number;
  likes: number;
  comments: number;
  // Whether the current user has liked this project
  liked: boolean;
  chapters: {
    id: string;
    title: string;
    index: number;
    contentHtml: string;
  }[];
}

// 美化的 CommentButton 组件 - 仿造 LikeButton 样式
const CommentButton = ({ 
  projectId, 
  commentCount, 
  size = 'md',
  isLoggedIn = false 
}: {
  projectId: string;
  commentCount: number;
  size?: 'sm' | 'md' | 'lg';
  isLoggedIn?: boolean;
}) => {
  const [isAnimating, setIsAnimating] = useState(false);

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

  const handleClick = () => {
    setIsAnimating(true);
    window.location.href = `/public/${projectId}/comments`;
    // Reset animation after a short delay
    setTimeout(() => setIsAnimating(false), 600);
  };

  return (
    <button
      onClick={handleClick}
      className={`
        inline-flex items-center gap-2 rounded-full transition-all duration-300
        ${config.button}
        bg-white border border-gray-200 text-gray-600 shadow-sm hover:shadow-md hover:border-gray-300
        cursor-pointer hover:-translate-y-0.5
        ${isAnimating ? 'transform-gpu' : ''}
      `}
      title="View comments"
    >
      <div className="relative">
        <MessageCircle 
          className={`
            ${config.icon} transition-all duration-300 text-gray-400 group-hover:text-blue-400
            ${isAnimating ? `transform ${config.scale}` : ''}
          `}
        />
        {isAnimating && (
          <div className="absolute inset-0 animate-ping">
            <MessageCircle className={`${config.icon} text-blue-200 opacity-75`} />
          </div>
        )}
      </div>
      <span className={`
        ${config.text} transition-colors duration-300 text-gray-700
        min-w-[1.5em] text-center
      `}>
        {commentCount}
      </span>
    </button>
  );
};

export default function PublicPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    async function fetchProjects() {
      try {
        const res = await fetch('/api/public');
        if (!res.ok) throw new Error('Failed to fetch');
        const data = await res.json();
        setProjects(data);
      } catch (error) {
        setErr('Failed to load stories');
      } finally {
        setLoading(false);
      }
    }
    fetchProjects();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-yellow-50">
        <div className="text-lg">Loading stories...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-yellow-50">
      <div className="max-w-4xl mx-auto py-8 px-4">
        <h1 className="text-5xl font-bold mb-6 text-center text-gray-800">
          Published Stories
        </h1>
        
        {err && <p className="text-red-600 text-center mb-4">{err}</p>}
        
        {projects.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600 text-lg">No published stories yet.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {projects.map((project) => (
              <div key={project.id} className="bg-white p-6 rounded-md shadow-lg">
                <div className="mb-4">
                  <h2 className="text-2xl font-bold text-gray-800 mb-2">
                    <Link 
                      href={`/public/${project.id}`}
                      className="hover:text-blue-600 transition"
                    >
                      {project.title}
                    </Link>
                  </h2>
                  <p className="text-gray-600 text-sm">by {project.owner.name}</p>
                </div>
                
                {project.synopsis && (
                  <p className="text-gray-700 mb-4">{project.synopsis}</p>
                )}
                
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-4">
                    <span className="text-sm text-gray-600">
                      {project.chapterCount} chapters
                    </span>
                    
                    {/* like button */}
                    <LikeButton 
                      projectId={project.id}
                      initialLikeCount={project.likes}
                      initialLiked={project.liked}
                      isLoggedIn={true}
                    />
                    
                    <CommentButton
                      projectId={project.id}
                      commentCount={project.comments}
                      isLoggedIn={true}
                    />
                  </div>
                  
                  <Link
                    href={`/public/${project.id}`}
                    className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition"
                  >
                    Read Story
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}