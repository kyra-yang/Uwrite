'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Reorder } from 'framer-motion';

type Chapter = {
  id: string;
  title: string;
  index: number;
};

export default function ProjectDetailClient({ projectId }: { projectId: string }) {
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [title, setTitle] = useState('');
  const router = useRouter();

  // get chapters
  async function fetchChapters() {
    const res = await fetch(`/api/chapters?projectId=${projectId}`);
    const data = await res.json();
    setChapters(data.items || []);
  }

  // create chapter
  async function createChapter() {
    if (!title) return;
    await fetch('/api/chapters', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ projectId, title }),
    });
    setTitle('');
    fetchChapters();
  }

  // move: up$down button
  async function moveChapter(chapterId: string, direction: 'up' | 'down') {
    const idx = chapters.findIndex((c) => c.id === chapterId);
    if (idx === -1) return;

    const newOrder = [...chapters];
    if (direction === 'up' && idx > 0) {
      [newOrder[idx - 1], newOrder[idx]] = [newOrder[idx], newOrder[idx - 1]];
    }
    if (direction === 'down' && idx < newOrder.length - 1) {
      [newOrder[idx + 1], newOrder[idx]] = [newOrder[idx], newOrder[idx + 1]];
    }
    setChapters(newOrder);
    await saveOrder(newOrder);
  }

  // save latest order
  async function saveOrder(newOrder: Chapter[]) {
    await fetch('/api/chapters/reorder', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        projectId,
        orderedChapterIds: newOrder.map((c) => c.id),
      }),
    });
  }

  // delete chapter
  async function deleteChapter(chapterId: string) {
    if (!confirm('Are you sure to delete it?')) return;
    await fetch(`/api/chapters/${chapterId}`, { method: 'DELETE' });
    fetchChapters();
  }

  // when end: save chapter and order
  function handleDragEnd(newOrder: Chapter[]) {
    setChapters(newOrder);
    saveOrder(newOrder);
  }

  useEffect(() => {
    fetchChapters();
  }, [projectId]);

  return (
    <div className="space-y-4 mt-4">
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

      <Reorder.Group axis="y" values={chapters} onReorder={handleDragEnd}>
        {chapters.map((c, i) => (
          <Reorder.Item key={c.id} value={c} className="flex justify-between items-center border p-2 mb-2 rounded hover:bg-gray-50">
            <div className="cursor-pointer" onClick={() => router.push(`/editor/${c.id}`)}>
              <span className="font-semibold">#{i + 1}</span> {c.title}
            </div>
            <div className="flex gap-1">
            <button
                onClick={() => moveChapter(c.id, 'up')}
                className="px-2 py-1 text-sm bg-gray-200 rounded"
            >
                ↑
            </button>
            <button
                onClick={() => moveChapter(c.id, 'down')}
                className="px-2 py-1 text-sm bg-gray-200 rounded"
            >
                ↓
            </button>
            <button
                onClick={() => deleteChapter(c.id)}
                className="px-2 py-1 text-sm bg-red-500 text-white rounded hover:bg-red-400 transition"
              >
                DELETE
            </button>
            </div>
          </Reorder.Item>
        ))}
      </Reorder.Group>
    </div>
  );
}
