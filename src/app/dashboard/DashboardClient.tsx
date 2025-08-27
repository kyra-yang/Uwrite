'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

type Project = {
  id: string;
  title: string;
  synopsis?: string;
  visibility: string;
  updatedAt: string;
};

// export in dashboard page
export default function DashboardClient() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState('');
  const router = useRouter();

  // get projects
  async function fetchProjects() {
    setLoading(true);
    const res = await fetch('/api/projects');
    const data = await res.json();
    setProjects(data.items || []);
    setLoading(false);
  }

  // create project
  async function createProject() {
    if (!title) return;
    await fetch('/api/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title }),
    });
    setTitle('');
    fetchProjects();
  }

  // delete project
  async function deleteProject(projectId: string) {
    if (!confirm('Are you sure to delete this project?')) return;
    await fetch(`/api/projects/${projectId}`, { method: 'DELETE' });
    fetchProjects();
  }

  useEffect(() => {
    fetchProjects();
  }, []);

  if (loading) return <p>Loading projects...</p>;

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="new project title"
          className="border px-2 py-1"
        />
        <button
          onClick={createProject}
          className="w-full bg-blue-600 text-white py-2 rounded-md text-lg hover:bg-green-700 transition"
        >
          create
        </button>
      </div>

      <ul className="space-y-2">
        {projects.map((p) => (
          <li
            key={p.id}
            className="border p-2 flex justify-between items-center hover:bg-gray-100"
          >
            <div
              className="cursor-pointer"
              onClick={() => router.push(`/projects/${p.id}`)}
            >
              <div className="font-semibold">{p.title}</div>
              <div className="text-sm text-gray-600">
                {p.synopsis || '(no description)'}
              </div>
            </div>

            <button
              onClick={(e) => {
                e.stopPropagation();
                deleteProject(p.id);
              }}
              className="ml-2 px-2 py-1 text-sm bg-red-500 text-white rounded hover:bg-red-400"
            >
              DELETE
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
