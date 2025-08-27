'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';

type Chapter = {
  id: string;
  title: string;
  index: number;
};

export default function ProjectDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [title, setTitle] = useState('');

  // get chapters
  async function fetchChapters() {
    const res = await fetch(`/api/chapters?projectId=${id}`);
    const data = await res.json();
    setChapters(data.items || []);
  }

  // create chapter
  async function createChapter() {
    if (!title) return;
    await fetch('/api/chapters', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ projectId: id, title }),
    });
    setTitle('');
    fetchChapters();
  }

  useEffect(() => {
    fetchChapters();
  }, [id]);

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-2xl font-bold">Projects List</h1>

      <div className="flex gap-2">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="new chapter title"
          className="border px-2 py-1"
        />
        <button onClick={createChapter} className="bg-green-500 text-white px-3 py-1 hover:bg-blue-700 transition">
          create
        </button>
      </div>

      <ul className="space-y-2">
        {chapters.map((c) => (
          <li
            key={c.id}
            className="border p-2 cursor-pointer hover:bg-gray-100"
            onClick={() => router.push(`/editor/${c.id}`)}
          >
            <span className="font-semibold">#{c.index + 1}</span> {c.title}
          </li>
        ))}
      </ul>
    </div>
  );
}
