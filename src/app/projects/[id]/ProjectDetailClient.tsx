'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Reorder } from 'framer-motion'

type Chapter = {
  id: string
  title: string
  index: number
  status: 'DRAFT' | 'PUBLISHED'
}

type Project = {
  id: string
  title: string
  synopsis?: string
  visibility: 'PRIVATE' | 'PUBLIC'
}

export default function ProjectDetailClient({ projectId }: { projectId: string }) {
  const [chapters, setChapters] = useState<Chapter[]>([])
  const [newChapterTitle, setNewChapterTitle] = useState('')
  const [project, setProject] = useState<Project | null>(null)
  const router = useRouter()

  // get project
  async function fetchProject() {
    const res = await fetch(`/api/projects/${projectId}`)
    const data = await res.json()
    setProject(data)
  }

  // save project
  async function saveProject() {
    if (!project) return
    await fetch(`/api/projects/${projectId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: project.title,
        synopsis: project.synopsis,
        visibility: project.visibility,
      }),
    })
    alert('Project updated!')
  }

  // get chapters
  async function fetchChapters() {
    const res = await fetch(`/api/chapters?projectId=${projectId}`)
    const data = await res.json()
    setChapters(data.items || [])
  }

  // create chapter
  async function createChapter() {
    if (!newChapterTitle) return
    await fetch('/api/chapters', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ projectId, title: newChapterTitle }),
    })
    setNewChapterTitle('')
    fetchChapters()
  }

  // update chapter status
  async function updateChapterStatus(chapterId: string, newStatus: 'DRAFT' | 'PUBLISHED') {
    try {
      const res = await fetch(`/api/chapters/${chapterId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
      
      if (!res.ok) throw new Error('Failed to update status')
      
      // Update local state
      setChapters(prevChapters => 
        prevChapters.map(chapter => 
          chapter.id === chapterId 
            ? { ...chapter, status: newStatus }
            : chapter
        )
      )
      
      alert(`Chapter ${newStatus.toLowerCase()} successfully!`)
    } catch (error) {
      // any error
      console.error('Error updating chapter status:', error)
      alert('Failed to update chapter status')
    }
  }

  // move chapter up or down
  async function moveChapter(chapterId: string, direction: 'up' | 'down') {
    const idx = chapters.findIndex((c) => c.id === chapterId)
    if (idx === -1) return

    const newOrder = [...chapters]
    if (direction === 'up' && idx > 0) {
      ;[newOrder[idx - 1], newOrder[idx]] = [newOrder[idx], newOrder[idx - 1]]
    }
    if (direction === 'down' && idx < newOrder.length - 1) {
      ;[newOrder[idx + 1], newOrder[idx]] = [newOrder[idx], newOrder[idx + 1]]
    }
    setChapters(newOrder)
    await saveOrder(newOrder)
  }

  // save new order
  async function saveOrder(newOrder: Chapter[]) {
    await fetch('/api/chapters/reorder', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        projectId,
        orderedChapterIds: newOrder.map((c) => c.id),
      }),
    })
  }

  // delete chapter
  async function deleteChapter(chapterId: string) {
    if (!confirm('Are you sure to delete it?')) return
    await fetch(`/api/chapters/${chapterId}`, { method: 'DELETE' })
    fetchChapters()
  }

  // reorder finished(end)
  function handleDragEnd(newOrder: Chapter[]) {
    setChapters(newOrder)
    saveOrder(newOrder)
  }

  useEffect(() => {
    fetchProject()
    fetchChapters()
  }, [projectId])

  return (
    <div className="space-y-6 mt-4">
      {project && (
        <div className="space-y-3 border p-3 rounded">
          <h2 className="font-bold text-lg">Edit Project</h2>
          <input
            value={project.title}
            onChange={(e) => setProject({ ...project, title: e.target.value })}
            placeholder="Project title"
            className="border px-2 py-1 w-full"
          />
          <textarea
            value={project.synopsis || ''}
            onChange={(e) => setProject({ ...project, synopsis: e.target.value })}
            placeholder="Project synopsis"
            className="border px-2 py-1 w-full"
          />
          <select
            value={project.visibility}
            onChange={(e) =>
              setProject({ ...project, visibility: e.target.value as 'PRIVATE' | 'PUBLIC' })
            }
            className="border px-2 py-1"
          >
            <option value="PRIVATE">Private</option>
            <option value="PUBLIC">Public</option>
          </select>
          <button
            onClick={saveProject}
            className="bg-blue-500 text-white px-4 py-1 rounded hover:bg-blue-700"
          >
            Save Project
          </button>
        </div>
      )}

      <div className="flex gap-2">
        <input
          value={newChapterTitle}
          onChange={(e) => setNewChapterTitle(e.target.value)}
          placeholder="new chapter title"
          className="border px-2 py-1"
        />
        <button
          onClick={createChapter}
          className="bg-green-500 text-white px-3 py-1 hover:bg-green-700 transition"
        >
          create
        </button>
      </div>

      <Reorder.Group axis="y" values={chapters} onReorder={handleDragEnd}>
        {chapters.map((c, i) => (
          <Reorder.Item
            key={c.id}
            value={c}
            className="flex justify-between items-center border p-3 mb-2 rounded hover:bg-gray-50"
          >
            <div className="flex items-center gap-3">
              <div
                className="cursor-pointer flex-1"
                onClick={() => router.push(`/editor/${c.id}`)}
              >
                <span className="font-semibold">#{i + 1}</span> {c.title}
              </div>
              
              {/* Status Badge */}
              <span className={`px-2 py-1 text-xs rounded-full ${
                c.status === 'PUBLISHED' 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-yellow-100 text-yellow-800'
              }`}>
                {c.status}
              </span>
            </div>

            <div className="flex gap-1">
              {/* Status Toggle Button */}
              <button
                onClick={() => updateChapterStatus(
                  c.id, 
                  c.status === 'DRAFT' ? 'PUBLISHED' : 'DRAFT'
                )}
                className={`px-2 py-1 text-sm rounded transition ${
                  c.status === 'DRAFT'
                    ? 'bg-green-500 text-white hover:bg-green-600'
                    : 'bg-yellow-500 text-white hover:bg-yellow-600'
                }`}
                title={c.status === 'DRAFT' ? 'Publish chapter' : 'Unpublish chapter'}
              >
                {c.status === 'DRAFT' ? 'PUBLISH' : 'UNPUBLISH'}
              </button>
              
              <button
                onClick={() => moveChapter(c.id, 'up')}
                className="px-2 py-1 text-sm bg-gray-200 rounded hover:bg-gray-300"
              >
                ↑
              </button>
              <button
                onClick={() => moveChapter(c.id, 'down')}
                className="px-2 py-1 text-sm bg-gray-200 rounded hover:bg-gray-300"
              >
                ↓
              </button>
              <button
                onClick={() => deleteChapter(c.id)}
                className="px-2 py-1 text-sm bg-red-500 text-white rounded hover:bg-red-600 transition"
              >
                DELETE
              </button>
            </div>
          </Reorder.Item>
        ))}
      </Reorder.Group>
    </div>
  )
}
