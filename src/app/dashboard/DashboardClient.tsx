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
        <button onClick={createProject} className="w-full bg-blue-600 text-white py-2 rounded-md text-lg hover:bg-green-700 transition">
          create
        </button>
      </div>

      <ul className="space-y-2">
        {projects.map((p) => (
          <li
            key={p.id}
            className="border p-2 cursor-pointer hover:bg-gray-100"
            onClick={() => router.push(`/projects/${p.id}`)}
          >
            <div className="font-semibold">{p.title}</div>
            <div className="text-sm text-gray-600">{p.synopsis || '(no description)'}</div>
          </li>
        ))}
      </ul>
    </div>
  );
}
