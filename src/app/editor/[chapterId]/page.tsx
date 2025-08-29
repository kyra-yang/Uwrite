'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { EditorContent, useEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'

type Chapter = {
  id: string
  title: string
  contentJson?: any
}

export default function EditorPage() {
  const { chapterId } = useParams()
  const [chapter, setChapter] = useState<Chapter | null>(null)
  const [loading, setLoading] = useState(true)

  // initlaize tiptap editor
  const editor = useEditor({
    extensions: [StarterKit],
    content: '', // empty content initially
  })

  // get the chapter data
  async function fetchChapter() {
    const res = await fetch(`/api/chapters/${chapterId}`)
    const data = await res.json()
    setChapter(data)
    if (data.contentJson && editor) {
      editor.commands.setContent(data.contentJson)
    }
    setLoading(false)
  }

  // save chapter content
  async function saveChapter() {
    if (!editor || !chapter) return
    const json = editor.getJSON()
    await fetch(`/api/chapters/${chapterId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: chapter.title,
        contentJson: json,
      }),
    })
    alert('saved successfully!')
  }

  useEffect(() => {
    fetchChapter()
  }, [chapterId, editor])

  if (loading) return <p>loading...</p>
  if (!chapter) return <p>can't find that chapter!</p>

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-xl font-bold">{chapter.title}</h1>
      <div className="border rounded p-2 min-h-[200px]">
        <EditorContent editor={editor} />
      </div>
      <button
        onClick={saveChapter}
        className="bg-blue-500 text-white px-4 py-2 hover:bg-blue-700 transition"
      >
        save
      </button>
    </div>
  )
}
