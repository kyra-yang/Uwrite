'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';

type Chapter = {
  id: string;
  title: string;
  contentJson?: any;
};

export default function EditorPage() {
  const { chapterId } = useParams();
  const [chapter, setChapter] = useState<Chapter | null>(null);
  const [content, setContent] = useState('');

  // get chapter
  async function fetchChapter() {
    const res = await fetch(`/api/chapters/${chapterId}`);
    const data = await res.json();
    setChapter(data);
    setContent(data.plainText || '');
  }

  // save chapter
  async function saveChapter() {
    await fetch(`/api/chapters/${chapterId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: chapter?.title,
        contentJson: { text: content },
      }),
    });
    alert('save success');
  }

  useEffect(() => {
    fetchChapter();
  }, [chapterId]);

  if (!chapter) return <p>Loading...</p>;

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-xl font-bold">{chapter.title}</h1>
      <textarea
        className="w-full h-64 border p-2"
        value={content}
        onChange={(e) => setContent(e.target.value)}
      />
      <button onClick={saveChapter} className="bg-blue-500 text-white px-4 py-2 hover:bg-blue-700 transition">
        save
      </button>
    </div>
  );
}
