'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import LikeButton from '@/components/LikeButton';
import CommentsSection from '@/components/CommentsSection';
import { MessageCircle } from 'lucide-react';

interface Chapter {
  id: string;
  title: string;
  index: number;
  contentHtml: string;
  createdAt: string;
}

interface ProjectDetail {
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
  liked: boolean;
  chapters: Chapter[];
}

const CommentButton = ({ 
  projectId, 
  commentCount, 
  size = 'md',
  isLoggedIn = false,
  scrollToComments = false 
}: {
  projectId: string;
  commentCount: number;
  size?: 'sm' | 'md' | 'lg';
  isLoggedIn?: boolean;
  scrollToComments?: boolean;
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
    
    if (scrollToComments) {
      const commentsElement = document.getElementById('comments-section');
      if (commentsElement) {
        commentsElement.scrollIntoView({ 
          behavior: 'smooth',
          block: 'start'
        });
      }
    } else {
      window.location.href = `/public/${projectId}/comments`;
    }
    
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
      title={scrollToComments ? "Scroll to comments" : "View comments"}
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

export default function ProjectDetailPage() {
  const params = useParams();
  const projectId = params.id as string;
  
  const [project, setProject] = useState<ProjectDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedChapter, setSelectedChapter] = useState<Chapter | null>(null);

  useEffect(() => {
    async function fetchProject() {
      try {
        const res = await fetch(`/api/public/${projectId}`);
        if (!res.ok) {
          if (res.status === 404) {
            throw new Error('Story not found');
          }
          throw new Error('Failed to fetch story');
        }
        const data = await res.json();
        setProject(data);
        
        // Set first chapter as default if available
        if (data.chapters && data.chapters.length > 0) {
          setSelectedChapter(data.chapters[0]);
        }
      } catch (error) {
        setError(error instanceof Error ? error.message : 'Failed to load story');
      } finally {
        setLoading(false);
      }
    }

    if (projectId) {
      fetchProject();
    }
  }, [projectId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-yellow-50">
        <div className="text-lg">Loading story...</div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="min-h-screen bg-yellow-50">
        <div className="max-w-4xl mx-auto py-8 px-4">
          <div className="text-center py-12">
            <p className="text-red-600 text-lg mb-4">{error || 'Story not found'}</p>
            <Link 
              href="/public" 
              className="text-blue-600 hover:text-blue-800 underline"
            >
              ← Back to all stories
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-yellow-50">
      <div className="max-w-6xl mx-auto py-8 px-4">
        {/* Header */}
        <div className="mb-8">
          <Link 
            href="/public" 
            className="text-blue-600 hover:text-blue-800 underline mb-4 inline-block"
          >
            ← Back to all stories
          </Link>
          
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <h1 className="text-4xl font-bold text-gray-800 mb-2">{project.title}</h1>
            <p className="text-gray-600 mb-4">by {project.owner.name}</p>
            
            {project.synopsis && (
              <p className="text-gray-700 mb-4">{project.synopsis}</p>
            )}
            
            {/* likes and comments */}
            <div className="flex items-center gap-6 mb-4">
              <LikeButton 
                projectId={project.id}
                initialLikeCount={project.likes}
                initialLiked={project.liked}
              />
              
              <CommentButton
                projectId={project.id}
                commentCount={project.comments}
                isLoggedIn={true}
                scrollToComments={true}
              />
            </div>
            
            <div className="flex gap-4 text-sm text-gray-600">
              <span>{project.chapters.length} of {project.chapterCount} chapters published</span>
              <span>Last updated: {new Date(project.updatedAt).toLocaleDateString()}</span>
            </div>
          </div>
        </div>

        {project.chapters.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600 text-lg">No published chapters yet.</p>
          </div>
        ) : (
          <div className="flex gap-8">
            {/* Chapter List Sidebar */}
            <div className="w-1/3">
              <div className="bg-white p-4 rounded-lg shadow-lg sticky top-8">
                <h3 className="text-xl font-semibold mb-4 text-gray-800">Chapters</h3>
                <div className="space-y-2">
                  {project.chapters
                    .sort((a, b) => a.index - b.index)
                    .map((chapter) => (
                      <button
                        key={chapter.id}
                        onClick={() => setSelectedChapter(chapter)}
                        className={`w-full text-left p-3 rounded-md transition ${
                          selectedChapter?.id === chapter.id
                            ? 'bg-blue-100 border-l-4 border-blue-500'
                            : 'hover:bg-gray-100'
                        }`}
                      >
                        <div className="font-medium text-gray-800">
                          Chapter {chapter.index}: {chapter.title}
                        </div>
                      </button>
                    ))}
                </div>
              </div>
            </div>

            {/* Chapter Content */}
            <div className="w-2/3">
              {selectedChapter ? (
                <div className="bg-white p-8 rounded-lg shadow-lg">
                  <h2 className="text-3xl font-bold text-gray-800 mb-6">
                    Chapter {selectedChapter.index}: {selectedChapter.title}
                  </h2>
                  
                  <div 
                    className="prose prose-lg max-w-none text-gray-700 leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: selectedChapter.contentHtml }}
                  />
                  
                  <div className="mt-8 pt-4 border-t border-gray-200">
                    <p className="text-sm text-gray-500">
                      Published: {new Date(selectedChapter.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="bg-white p-8 rounded-lg shadow-lg text-center">
                  <p className="text-gray-600">Select a chapter to start reading</p>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="mt-12" id="comments-section">
          <CommentsSection projectId={projectId} />
        </div>
      </div>
    </div>
  );
}