'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

type Project = {
  id: string;
  title: string;
  synopsis?: string;
  visibility: string;
  updatedAt: string;
};

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  // get projects
  async function fetchProjects() {
    setLoading(true);
    try {
      const res = await fetch('/api/projects');
      if (!res.ok) {
        if (res.status === 401) {
          setError('please login first');
          router.push('/login');
          return;
        }
        throw new Error('fetch projects failed');
      }
      const data = await res.json();
      setProjects(data.items || []);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'fetch projects failed');
    } finally {
      setLoading(false);
    }
  }

  // create project
  async function createProject() {
    if (!title.trim()) return;
    
    try {
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: title.trim() }),
      });

      if (!response.ok) {
        if (response.status === 401) {
          alert('please login first');
          router.push('/login');
          return;
        }
        throw new Error('create project failed');
      }

      setTitle('');
      await fetchProjects();
    } catch (error) {
      alert(error instanceof Error ? error.message : 'create project failed');
    }
  }

  // delete project
  async function deleteProject(projectId: string) {
    if (!confirm('Are you sure to DELETE it ? v...v')) return;
    
    try {
      const response = await fetch(`/api/projects/${projectId}`, { 
        method: 'DELETE' 
      });

      if (!response.ok) {
        if (response.status === 401) {
          alert('please login first');
          router.push('/login');
          return;
        }
        throw new Error('delete project failed');
      }

      await fetchProjects();
    } catch (error) {
      alert(error instanceof Error ? error.message : 'delete project failed');
    }
  }

  useEffect(() => {
    fetchProjects();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-yellow-50 flex items-center justify-center">
        <div className="text-lg">projects loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-yellow-50">
      <div className="max-w-4xl mx-auto py-8 px-4">
        {/* navigate head */}
        <div className="mb-8">
          <Link 
            href="/dashboard" 
            className="text-blue-600 hover:text-blue-800 underline mb-4 inline-block"
          >
            back to dashboard
          </Link>
          <h1 className="text-4xl font-bold text-gray-800 mb-2">My Projects</h1>
          <p className="text-gray-600">manage your projects</p>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        {/* create projects */}
        <div className="bg-white p-6 rounded-lg shadow-lg mb-8">
          <h2 className="text-xl font-semibold mb-4">create something new</h2>
          <div className="flex gap-3">
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="enter the title of your new project"
              className="flex-1 border border-gray-300 px-4 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              onKeyUp={(e) => {
                if (e.key === 'Enter') createProject();
              }}
            />
            <button
              onClick={createProject}
              disabled={!title.trim()}
              className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              create
            </button>
          </div>
        </div>

        {/* projects list */}
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <h2 className="text-xl font-semibold mb-4">projects list</h2>
          
          {projects.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <p className="text-lg mb-2">no project yet</p>
              <p>create a new project then start your jouney!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {projects.map((project) => (
                <div
                  key={project.id}
                  className="border border-gray-200 p-4 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex justify-between items-start">
                    <div 
                      className="flex-1 cursor-pointer"
                      onClick={() => router.push(`/projects/${project.id}`)}
                    >
                      <h3 className="text-lg font-semibold text-gray-800 mb-1">
                        {project.title}
                      </h3>
                      <p className="text-sm text-gray-600 mb-2">
                        {project.synopsis || 'no description yet but you know it is a big work'}
                      </p>
                      <div className="text-xs text-gray-500">
                        last updated: {new Date(project.updatedAt).toLocaleDateString('zh-CN')}
                      </div>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteProject(project.id);
                      }}
                      className="ml-4 px-3 py-1 text-sm bg-red-500 text-white rounded hover:bg-red-400 transition"
                      title="delete project"
                    >
                      DELETE
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}