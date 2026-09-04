'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import {
  formatPlannedDate,
  plannedDateToInputValue,
  type TeacherSocialPost,
} from '@/lib/teacher-social-posts'

function todayInputValue() {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function reorderPostList(
  posts: TeacherSocialPost[],
  sourceId: string,
  targetId: string
) {
  if (sourceId === targetId) return posts

  const next = [...posts]
  const sourceIndex = next.findIndex((post) => post.id === sourceId)
  const targetIndex = next.findIndex((post) => post.id === targetId)

  if (sourceIndex === -1 || targetIndex === -1) return posts

  const [moved] = next.splice(sourceIndex, 1)
  next.splice(targetIndex, 0, moved)
  return next
}

export default function SocialMediaPlanner() {
  const [openPosts, setOpenPosts] = useState<TeacherSocialPost[]>([])
  const [donePosts, setDonePosts] = useState<TeacherSocialPost[]>([])
  const [newTitle, setNewTitle] = useState('')
  const [newDate, setNewDate] = useState(todayInputValue)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [draggedId, setDraggedId] = useState<string | null>(null)
  const [dragOverId, setDragOverId] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingTitle, setEditingTitle] = useState('')
  const [editingDate, setEditingDate] = useState('')
  const [savingEdit, setSavingEdit] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const dragSourceRef = useRef<string | null>(null)
  const dragOverRef = useRef<string | null>(null)
  const dragStartOrderRef = useRef<TeacherSocialPost[]>([])
  const dragOrderRef = useRef<TeacherSocialPost[]>([])
  const openPostsRef = useRef<TeacherSocialPost[]>([])
  openPostsRef.current = openPosts

  const loadPosts = useCallback(async () => {
    setError(null)
    const response = await fetch('/api/teacher-social-posts')
    const data = await response.json().catch(() => [])

    if (!response.ok) {
      const message =
        typeof data.error === 'string' ? data.error : 'Failed to load social posts'
      setError(message)
      return
    }

    const posts = data as TeacherSocialPost[]
    setOpenPosts(posts.filter((post) => post.status === 'OPEN').sort((a, b) => a.sortOrder - b.sortOrder))
    setDonePosts(
      posts
        .filter((post) => post.status === 'DONE')
        .sort(
          (a, b) =>
            new Date(b.completedAt ?? 0).getTime() - new Date(a.completedAt ?? 0).getTime()
        )
    )
  }, [])

  useEffect(() => {
    loadPosts().finally(() => setLoading(false))
  }, [loadPosts])

  const handleAdd = async (event: React.FormEvent) => {
    event.preventDefault()
    const title = newTitle.trim()
    if (!title || !newDate) return

    setSubmitting(true)
    setError(null)

    try {
      const response = await fetch('/api/teacher-social-posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, plannedDate: newDate }),
      })
      const data = await response.json().catch(() => ({}))

      if (!response.ok) {
        const message =
          typeof data.error === 'string' ? data.error : 'Failed to add social post'
        setError(message)
        return
      }

      setNewTitle('')
      setNewDate(todayInputValue())
      setOpenPosts((current) => [...current, data as TeacherSocialPost])
    } catch {
      setError('Failed to add social post. Check your connection and try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleComplete = async (postId: string) => {
    setError(null)
    const post = openPosts.find((item) => item.id === postId)
    if (!post) return

    setOpenPosts((current) => current.filter((item) => item.id !== postId))

    try {
      const response = await fetch(`/api/teacher-social-posts/${postId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'DONE' }),
      })
      const data = await response.json().catch(() => ({}))

      if (!response.ok) {
        const message =
          typeof data.error === 'string' ? data.error : 'Failed to mark post as done'
        setError(message)
        await loadPosts()
        return
      }

      setDonePosts((current) => [data as TeacherSocialPost, ...current])
    } catch {
      setError('Failed to mark post as done. Check your connection and try again.')
      await loadPosts()
    }
  }

  const persistOrder = async (orderedIds: string[]) => {
    const response = await fetch('/api/teacher-social-posts/reorder', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderedIds }),
    })
    const data = await response.json().catch(() => ({}))

    if (!response.ok) {
      const message =
        typeof data.error === 'string' ? data.error : 'Failed to reorder social posts'
      throw new Error(message)
    }

    setOpenPosts(data as TeacherSocialPost[])
  }

  const finishDrag = useCallback(async () => {
    if (!dragSourceRef.current) {
      setDraggedId(null)
      setDragOverId(null)
      return
    }

    const previous = dragStartOrderRef.current
    dragSourceRef.current = null
    dragOverRef.current = null
    setDraggedId(null)
    setDragOverId(null)

    const current = dragOrderRef.current
    const previousIds = previous.map((post) => post.id).join(',')
    const currentIds = current.map((post) => post.id).join(',')

    if (previousIds === currentIds) return

    try {
      await persistOrder(current.map((post) => post.id))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reorder social posts')
      setOpenPosts(previous)
    }
  }, [])

  useEffect(() => {
    if (!draggedId) return

    const onPointerMove = (event: PointerEvent) => {
      const element = document.elementFromPoint(event.clientX, event.clientY)
      const postElement = element?.closest('[data-social-post-id]') as HTMLElement | null
      const overId = postElement?.getAttribute('data-social-post-id')
      const sourceId = dragSourceRef.current

      if (!overId || !sourceId || overId === dragOverRef.current) return

      dragOverRef.current = overId
      setDragOverId(overId)
      const next = reorderPostList(dragOrderRef.current, sourceId, overId)
      dragOrderRef.current = next
      setOpenPosts(next)
    }

    const onPointerUp = () => {
      void finishDrag()
    }

    window.addEventListener('pointermove', onPointerMove)
    window.addEventListener('pointerup', onPointerUp)
    window.addEventListener('pointercancel', onPointerUp)

    return () => {
      window.removeEventListener('pointermove', onPointerMove)
      window.removeEventListener('pointerup', onPointerUp)
      window.removeEventListener('pointercancel', onPointerUp)
    }
  }, [draggedId, finishDrag])

  const startDrag = (event: React.PointerEvent, postId: string) => {
    if (editingId) return

    event.preventDefault()
    dragStartOrderRef.current = [...openPostsRef.current]
    dragOrderRef.current = [...openPostsRef.current]
    dragSourceRef.current = postId
    dragOverRef.current = postId
    setDraggedId(postId)
    setDragOverId(postId)
    event.currentTarget.setPointerCapture(event.pointerId)
  }

  const startEditing = (post: TeacherSocialPost) => {
    setEditingId(post.id)
    setEditingTitle(post.title)
    setEditingDate(plannedDateToInputValue(post.plannedDate))
    setError(null)
  }

  const cancelEditing = () => {
    setEditingId(null)
    setEditingTitle('')
    setEditingDate('')
  }

  const handleSaveEdit = async (postId: string, status: TeacherSocialPost['status']) => {
    const title = editingTitle.trim()
    if (!title) {
      setError('Post title cannot be empty')
      return
    }
    if (!editingDate) {
      setError('A planned date is required')
      return
    }

    const previousOpen = openPosts
    const previousDone = donePosts
    const updateList = (posts: TeacherSocialPost[]) =>
      posts.map((post) =>
        post.id === postId
          ? { ...post, title, plannedDate: `${editingDate}T12:00:00.000Z` }
          : post
      )

    if (status === 'OPEN') {
      setOpenPosts(updateList(openPosts))
    } else {
      setDonePosts(updateList(donePosts))
    }

    setSavingEdit(true)
    setError(null)

    try {
      const response = await fetch(`/api/teacher-social-posts/${postId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, plannedDate: editingDate }),
      })
      const data = await response.json().catch(() => ({}))

      if (!response.ok) {
        const message =
          typeof data.error === 'string' ? data.error : 'Failed to update social post'
        setError(message)
        setOpenPosts(previousOpen)
        setDonePosts(previousDone)
        return
      }

      const updated = data as TeacherSocialPost
      if (updated.status === 'OPEN') {
        setOpenPosts((current) =>
          current.map((post) => (post.id === postId ? updated : post))
        )
      } else {
        setDonePosts((current) =>
          current.map((post) => (post.id === postId ? updated : post))
        )
      }
      cancelEditing()
    } catch {
      setError('Failed to update social post. Check your connection and try again.')
      setOpenPosts(previousOpen)
      setDonePosts(previousDone)
    } finally {
      setSavingEdit(false)
    }
  }

  const handleDelete = async (post: TeacherSocialPost) => {
    const confirmed = window.confirm(`Delete "${post.title}"? This cannot be undone.`)
    if (!confirmed) return

    if (editingId === post.id) cancelEditing()

    setError(null)
    setDeletingId(post.id)

    const previousOpen = openPosts
    const previousDone = donePosts

    if (post.status === 'OPEN') {
      setOpenPosts((current) => current.filter((item) => item.id !== post.id))
    } else {
      setDonePosts((current) => current.filter((item) => item.id !== post.id))
    }

    try {
      const response = await fetch(`/api/teacher-social-posts/${post.id}`, {
        method: 'DELETE',
      })
      const data = await response.json().catch(() => ({}))

      if (!response.ok) {
        const message =
          typeof data.error === 'string' ? data.error : 'Failed to delete social post'
        setError(message)
        setOpenPosts(previousOpen)
        setDonePosts(previousDone)
      }
    } catch {
      setError('Failed to delete social post. Check your connection and try again.')
      setOpenPosts(previousOpen)
      setDonePosts(previousDone)
    } finally {
      setDeletingId(null)
    }
  }

  if (loading) {
    return <p className="text-sm text-gray-500">Loading social posts…</p>
  }

  return (
    <div className="space-y-8">
      {error && (
        <p
          className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          role="alert"
        >
          {error}
        </p>
      )}

      <form onSubmit={handleAdd} className="space-y-3">
        <label htmlFor="new-social-post" className="sr-only">
          New social media idea
        </label>
        <input
          id="new-social-post"
          type="text"
          value={newTitle}
          onChange={(event) => setNewTitle(event.target.value)}
          placeholder="Add a social media idea…"
          className="w-full rounded-md border border-gray-300 px-4 py-2 text-gray-900 shadow-sm focus:border-[#38438f] focus:outline-none focus:ring-1 focus:ring-[#38438f]"
        />
        <div className="flex flex-col gap-3 sm:flex-row">
          <label className="flex flex-1 items-center gap-2 text-sm text-gray-600">
            <span className="shrink-0 font-medium">Date</span>
            <input
              type="date"
              value={newDate}
              onChange={(event) => setNewDate(event.target.value)}
              required
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 shadow-sm focus:border-[#38438f] focus:outline-none focus:ring-1 focus:ring-[#38438f]"
            />
          </label>
          <button
            type="submit"
            disabled={submitting || !newTitle.trim() || !newDate}
            className="rounded-md px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-[#2d3569] disabled:opacity-50"
            style={{ backgroundColor: '#38438f' }}
          >
            {submitting ? 'Adding…' : 'Add idea'}
          </button>
        </div>
      </form>

      <section>
        <h2 className="mb-4 text-xl font-semibold text-gray-900">Planned</h2>
        {openPosts.length === 0 ? (
          <p className="rounded-lg border border-dashed border-gray-300 bg-white px-4 py-8 text-center text-sm text-gray-500">
            No planned posts yet. Add an idea above to start your schedule.
          </p>
        ) : (
          <ul className={`space-y-3 ${draggedId ? 'select-none' : ''}`}>
            {openPosts.map((post) => {
              const isDragging = draggedId === post.id
              const isDragOver = dragOverId === post.id && draggedId !== post.id

              return (
                <li
                  key={post.id}
                  data-social-post-id={post.id}
                  className={`rounded-lg border-2 px-4 py-4 shadow-sm transition-all ${
                    isDragging ? 'opacity-50' : ''
                  } ${
                    isDragOver
                      ? 'border-sky-500 bg-sky-100'
                      : 'border-sky-300 bg-sky-50 hover:border-sky-400'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div
                      role="button"
                      tabIndex={0}
                      onPointerDown={(event) => startDrag(event, post.id)}
                      className="mt-0.5 cursor-grab rounded p-1 text-sky-400 hover:bg-sky-100 active:cursor-grabbing touch-none"
                      aria-label={`Drag to reorder ${post.title}`}
                    >
                      <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                        <path d="M7 4a1 1 0 1 1-2 0 1 1 0 0 1 2 0ZM7 10a1 1 0 1 1-2 0 1 1 0 0 1 2 0ZM7 16a1 1 0 1 1-2 0 1 1 0 0 1 2 0ZM13 4a1 1 0 1 1-2 0 1 1 0 0 1 2 0ZM13 10a1 1 0 1 1-2 0 1 1 0 0 1 2 0ZM13 16a1 1 0 1 1-2 0 1 1 0 0 1 2 0Z" />
                      </svg>
                    </div>

                    <input
                      type="checkbox"
                      checked={false}
                      onChange={() => void handleComplete(post.id)}
                      className="mt-1 h-5 w-5 rounded border-sky-400 text-green-600 focus:ring-green-500"
                      aria-label={`Mark ${post.title} as posted`}
                    />

                    <div className="min-w-0 flex-1">
                      {editingId === post.id ? (
                        <form
                          className="space-y-2"
                          onSubmit={(event) => {
                            event.preventDefault()
                            void handleSaveEdit(post.id, 'OPEN')
                          }}
                        >
                          <input
                            type="text"
                            value={editingTitle}
                            onChange={(event) => setEditingTitle(event.target.value)}
                            autoFocus
                            disabled={savingEdit}
                            className="w-full rounded-md border border-sky-300 bg-white px-3 py-1.5 text-base text-gray-900 focus:border-[#38438f] focus:outline-none focus:ring-1 focus:ring-[#38438f]"
                            aria-label="Edit post title"
                          />
                          <input
                            type="date"
                            value={editingDate}
                            onChange={(event) => setEditingDate(event.target.value)}
                            disabled={savingEdit}
                            required
                            className="w-full rounded-md border border-sky-300 bg-white px-3 py-1.5 text-sm text-gray-900 focus:border-[#38438f] focus:outline-none focus:ring-1 focus:ring-[#38438f]"
                            aria-label="Edit planned date"
                          />
                          <div className="flex gap-2">
                            <button
                              type="submit"
                              disabled={savingEdit || !editingTitle.trim() || !editingDate}
                              className="rounded-md px-3 py-1.5 text-sm font-medium text-white disabled:opacity-50"
                              style={{ backgroundColor: '#38438f' }}
                            >
                              {savingEdit ? 'Saving…' : 'Save'}
                            </button>
                            <button
                              type="button"
                              onClick={cancelEditing}
                              disabled={savingEdit}
                              className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                            >
                              Cancel
                            </button>
                          </div>
                        </form>
                      ) : (
                        <>
                          <p className="text-base font-medium text-sky-950">{post.title}</p>
                          <p className="mt-1 text-sm font-medium text-sky-700">
                            {formatPlannedDate(post.plannedDate)}
                          </p>
                        </>
                      )}
                    </div>

                    {editingId !== post.id && (
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => startEditing(post)}
                          className="rounded p-1.5 text-sky-600 hover:bg-sky-100"
                          aria-label={`Edit ${post.title}`}
                        >
                          <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                            <path d="m2.695 14.363 1.222-1.222a1 1 0 0 1 1.414 0l1.222 1.222a1 1 0 0 1 0 1.414l-1.222 1.222a1 1 0 0 1-1.414 0l-1.222-1.222a1 1 0 0 1 0-1.414ZM5.05 13.05l6.364-6.364 1.222 1.222-6.364 6.364-1.222-1.222ZM13.636 4.464l1.06-1.06a1.5 1.5 0 0 1 2.122 0l1.414 1.414a1.5 1.5 0 0 1 0 2.122l-1.06 1.06-2.476-2.476Z" />
                          </svg>
                        </button>
                        <button
                          type="button"
                          onClick={() => void handleDelete(post)}
                          disabled={deletingId === post.id}
                          className="rounded p-1.5 text-sky-600 hover:bg-sky-100 disabled:opacity-50"
                          aria-label={`Delete ${post.title}`}
                        >
                          <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                            <path
                              fillRule="evenodd"
                              d="M8.75 2A2.75 2.75 0 0 0 6 4.75V5H3.75a.75.75 0 0 0 0 1.5h.375l.83 11.084A2.75 2.75 0 0 0 7.348 20h5.304a2.75 2.75 0 0 0 2.743-2.416l.83-11.084h.375a.75.75 0 0 0 0-1.5H14v-.25A2.75 2.75 0 0 0 11.25 2h-2.5ZM7.5 5v-.25c0-.69.56-1.25 1.25-1.25h2.5c.69 0 1.25.56 1.25 1.25V5h-5Zm1.25 4.25a.75.75 0 0 0-1.5 0v5.5a.75.75 0 0 0 1.5 0v-5.5ZM13 9.25a.75.75 0 0 0-1.5 0v5.5a.75.75 0 0 0 1.5 0v-5.5Z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </button>
                      </div>
                    )}
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </section>

      <section>
        <h2 className="mb-4 text-xl font-semibold text-gray-900">Posted</h2>
        {donePosts.length === 0 ? (
          <p className="rounded-lg border border-dashed border-gray-300 bg-white px-4 py-8 text-center text-sm text-gray-500">
            Posted ideas will appear here.
          </p>
        ) : (
          <div className="overflow-hidden rounded-lg border border-green-200 bg-white shadow">
            <table className="min-w-full divide-y divide-green-100">
              <thead className="bg-green-50">
                <tr>
                  <th
                    scope="col"
                    className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-green-800"
                  >
                    Idea
                  </th>
                  <th
                    scope="col"
                    className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-green-800"
                  >
                    Planned
                  </th>
                  <th
                    scope="col"
                    className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-green-800"
                  >
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-green-100">
                {donePosts.map((post) => (
                  <tr key={post.id} className="bg-green-50/70">
                    <td className="px-4 py-3 text-sm font-medium text-green-900">
                      {editingId === post.id ? (
                        <form
                          className="space-y-2"
                          onSubmit={(event) => {
                            event.preventDefault()
                            void handleSaveEdit(post.id, 'DONE')
                          }}
                        >
                          <input
                            type="text"
                            value={editingTitle}
                            onChange={(event) => setEditingTitle(event.target.value)}
                            autoFocus
                            disabled={savingEdit}
                            className="w-full rounded-md border border-green-300 bg-white px-3 py-1.5 text-sm text-gray-900 focus:border-[#38438f] focus:outline-none focus:ring-1 focus:ring-[#38438f]"
                          />
                          <input
                            type="date"
                            value={editingDate}
                            onChange={(event) => setEditingDate(event.target.value)}
                            disabled={savingEdit}
                            required
                            className="w-full rounded-md border border-green-300 bg-white px-3 py-1.5 text-sm text-gray-900 focus:border-[#38438f] focus:outline-none focus:ring-1 focus:ring-[#38438f]"
                          />
                          <div className="flex gap-2">
                            <button
                              type="submit"
                              disabled={savingEdit || !editingTitle.trim() || !editingDate}
                              className="rounded-md px-3 py-1.5 text-sm font-medium text-white disabled:opacity-50"
                              style={{ backgroundColor: '#38438f' }}
                            >
                              {savingEdit ? 'Saving…' : 'Save'}
                            </button>
                            <button
                              type="button"
                              onClick={cancelEditing}
                              disabled={savingEdit}
                              className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                            >
                              Cancel
                            </button>
                          </div>
                        </form>
                      ) : (
                        <div className="flex items-center gap-3">
                          <span className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded border border-green-500 bg-green-500 text-xs text-white">
                            ✓
                          </span>
                          <span>{post.title}</span>
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-green-800">
                      {formatPlannedDate(post.plannedDate)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {editingId !== post.id && (
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => startEditing(post)}
                            className="rounded p-1.5 text-green-700 hover:bg-green-100"
                            aria-label={`Edit ${post.title}`}
                          >
                            <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                              <path d="m2.695 14.363 1.222-1.222a1 1 0 0 1 1.414 0l1.222 1.222a1 1 0 0 1 0 1.414l-1.222 1.222a1 1 0 0 1-1.414 0l-1.222-1.222a1 1 0 0 1 0-1.414ZM5.05 13.05l6.364-6.364 1.222 1.222-6.364 6.364-1.222-1.222ZM13.636 4.464l1.06-1.06a1.5 1.5 0 0 1 2.122 0l1.414 1.414a1.5 1.5 0 0 1 0 2.122l-1.06 1.06-2.476-2.476Z" />
                            </svg>
                          </button>
                          <button
                            type="button"
                            onClick={() => void handleDelete(post)}
                            disabled={deletingId === post.id}
                            className="rounded p-1.5 text-green-700 hover:bg-green-100 disabled:opacity-50"
                            aria-label={`Delete ${post.title}`}
                          >
                            <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                              <path
                                fillRule="evenodd"
                                d="M8.75 2A2.75 2.75 0 0 0 6 4.75V5H3.75a.75.75 0 0 0 0 1.5h.375l.83 11.084A2.75 2.75 0 0 0 7.348 20h5.304a2.75 2.75 0 0 0 2.743-2.416l.83-11.084h.375a.75.75 0 0 0 0-1.5H14v-.25A2.75 2.75 0 0 0 11.25 2h-2.5ZM7.5 5v-.25c0-.69.56-1.25 1.25-1.25h2.5c.69 0 1.25.56 1.25 1.25V5h-5Zm1.25 4.25a.75.75 0 0 0-1.5 0v5.5a.75.75 0 0 0 1.5 0v-5.5ZM13 9.25a.75.75 0 0 0-1.5 0v5.5a.75.75 0 0 0 1.5 0v-5.5Z"
                                clipRule="evenodd"
                              />
                            </svg>
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}
