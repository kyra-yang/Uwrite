'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import LikeButton from '@/components/LikeButton';

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
                    
                    {/* comment numbers */}
                    <div className="flex items-center gap-1 text-gray-600 text-sm">
                      <span>💬</span>
                      <span>{project.comments}</span>
                    </div>
                    
                    {/* view comments */}
                    <Link
                      href={`/public/${project.id}/comments`}
                      className="text-blue-600 text-sm hover:underline"
                    >
                      View comments
                    </Link>
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