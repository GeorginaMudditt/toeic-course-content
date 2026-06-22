'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import type { TeacherTask } from '@/lib/teacher-tasks'

function formatDate(value: string | null) {
  if (!value) return '—'
  return new Date(value).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

function reorderTaskList(tasks: TeacherTask[], sourceId: string, targetId: string) {
  if (sourceId === targetId) return tasks

  const next = [...tasks]
  const sourceIndex = next.findIndex((task) => task.id === sourceId)
  const targetIndex = next.findIndex((task) => task.id === targetId)

  if (sourceIndex === -1 || targetIndex === -1) return tasks

  const [moved] = next.splice(sourceIndex, 1)
  next.splice(targetIndex, 0, moved)
  return next
}

export default function WhatsNextTaskBoard() {
  const [openTasks, setOpenTasks] = useState<TeacherTask[]>([])
  const [doneTasks, setDoneTasks] = useState<TeacherTask[]>([])
  const [newTaskTitle, setNewTaskTitle] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [draggedId, setDraggedId] = useState<string | null>(null)
  const [dragOverId, setDragOverId] = useState<string | null>(null)
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null)
  const [editingTitle, setEditingTitle] = useState('')
  const [savingEdit, setSavingEdit] = useState(false)
  const dragSourceRef = useRef<string | null>(null)
  const dragOverRef = useRef<string | null>(null)
  const dragStartOrderRef = useRef<TeacherTask[]>([])
  const dragOrderRef = useRef<TeacherTask[]>([])
  const openTasksRef = useRef<TeacherTask[]>([])
  openTasksRef.current = openTasks

  const loadTasks = useCallback(async () => {
    setError(null)
    const response = await fetch('/api/teacher-tasks')
    const data = await response.json().catch(() => [])

    if (!response.ok) {
      const message = typeof data.error === 'string' ? data.error : 'Failed to load tasks'
      setError(message)
      return
    }

    const tasks = data as TeacherTask[]
    setOpenTasks(tasks.filter((task) => task.status === 'OPEN').sort((a, b) => a.sortOrder - b.sortOrder))
    setDoneTasks(
      tasks
        .filter((task) => task.status === 'DONE')
        .sort((a, b) => new Date(b.completedAt ?? 0).getTime() - new Date(a.completedAt ?? 0).getTime())
    )
  }, [])

  useEffect(() => {
    loadTasks().finally(() => setLoading(false))
  }, [loadTasks])

  const handleAddTask = async (event: React.FormEvent) => {
    event.preventDefault()
    const title = newTaskTitle.trim()
    if (!title) return

    setSubmitting(true)
    setError(null)

    try {
      const response = await fetch('/api/teacher-tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title }),
      })
      const data = await response.json().catch(() => ({}))

      if (!response.ok) {
        const message = typeof data.error === 'string' ? data.error : 'Failed to add task'
        setError(message)
        return
      }

      setNewTaskTitle('')
      setOpenTasks((current) => [...current, data as TeacherTask])
    } catch {
      setError('Failed to add task. Check your connection and try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleComplete = async (taskId: string) => {
    setError(null)
    const task = openTasks.find((item) => item.id === taskId)
    if (!task) return

    setOpenTasks((current) => current.filter((item) => item.id !== taskId))

    try {
      const response = await fetch(`/api/teacher-tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'DONE' }),
      })
      const data = await response.json().catch(() => ({}))

      if (!response.ok) {
        const message = typeof data.error === 'string' ? data.error : 'Failed to complete task'
        setError(message)
        await loadTasks()
        return
      }

      setDoneTasks((current) => [data as TeacherTask, ...current])
    } catch {
      setError('Failed to complete task. Check your connection and try again.')
      await loadTasks()
    }
  }

  const persistOrder = async (orderedIds: string[]) => {
    const response = await fetch('/api/teacher-tasks/reorder', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderedIds }),
    })
    const data = await response.json().catch(() => ({}))

    if (!response.ok) {
      const message = typeof data.error === 'string' ? data.error : 'Failed to reorder tasks'
      throw new Error(message)
    }

    setOpenTasks(data as TeacherTask[])
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
    const previousIds = previous.map((task) => task.id).join(',')
    const currentIds = current.map((task) => task.id).join(',')

    if (previousIds === currentIds) return

    try {
      await persistOrder(current.map((task) => task.id))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reorder tasks')
      setOpenTasks(previous)
    }
  }, [])

  useEffect(() => {
    if (!draggedId) return

    const onPointerMove = (event: PointerEvent) => {
      const element = document.elementFromPoint(event.clientX, event.clientY)
      const taskElement = element?.closest('[data-task-id]') as HTMLElement | null
      const overId = taskElement?.getAttribute('data-task-id')
      const sourceId = dragSourceRef.current

      if (!overId || !sourceId || overId === dragOverRef.current) return

      dragOverRef.current = overId
      setDragOverId(overId)
      const next = reorderTaskList(dragOrderRef.current, sourceId, overId)
      dragOrderRef.current = next
      setOpenTasks(next)
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

  const startDrag = (event: React.PointerEvent, taskId: string) => {
    if (editingTaskId) return

    event.preventDefault()
    dragStartOrderRef.current = [...openTasksRef.current]
    dragOrderRef.current = [...openTasksRef.current]
    dragSourceRef.current = taskId
    dragOverRef.current = taskId
    setDraggedId(taskId)
    setDragOverId(taskId)
    event.currentTarget.setPointerCapture(event.pointerId)
  }

  const startEditing = (task: TeacherTask) => {
    setEditingTaskId(task.id)
    setEditingTitle(task.title)
    setError(null)
  }

  const cancelEditing = () => {
    setEditingTaskId(null)
    setEditingTitle('')
  }

  const handleSaveEdit = async (taskId: string, status: TeacherTask['status']) => {
    const title = editingTitle.trim()
    if (!title) {
      setError('Task title cannot be empty')
      return
    }

    const previousOpen = openTasks
    const previousDone = doneTasks
    const updateList = (tasks: TeacherTask[]) =>
      tasks.map((task) => (task.id === taskId ? { ...task, title } : task))

    if (status === 'OPEN') {
      setOpenTasks(updateList(openTasks))
    } else {
      setDoneTasks(updateList(doneTasks))
    }

    setSavingEdit(true)
    setError(null)

    try {
      const response = await fetch(`/api/teacher-tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title }),
      })
      const data = await response.json().catch(() => ({}))

      if (!response.ok) {
        const message = typeof data.error === 'string' ? data.error : 'Failed to update task'
        setError(message)
        setOpenTasks(previousOpen)
        setDoneTasks(previousDone)
        return
      }

      const updated = data as TeacherTask
      if (updated.status === 'OPEN') {
        setOpenTasks((current) => current.map((task) => (task.id === taskId ? updated : task)))
      } else {
        setDoneTasks((current) => current.map((task) => (task.id === taskId ? updated : task)))
      }
      cancelEditing()
    } catch {
      setError('Failed to update task. Check your connection and try again.')
      setOpenTasks(previousOpen)
      setDoneTasks(previousDone)
    } finally {
      setSavingEdit(false)
    }
  }

  if (loading) {
    return <p className="text-sm text-gray-500">Loading tasks…</p>
  }

  return (
    <div className="space-y-10">
      {error && (
        <p className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
          {error}
        </p>
      )}

      <form onSubmit={handleAddTask} className="flex flex-col gap-3 sm:flex-row">
        <label htmlFor="new-task" className="sr-only">
          New task
        </label>
        <input
          id="new-task"
          type="text"
          value={newTaskTitle}
          onChange={(event) => setNewTaskTitle(event.target.value)}
          placeholder="Add a new task…"
          className="flex-1 rounded-md border border-gray-300 px-4 py-2 text-gray-900 shadow-sm focus:border-[#38438f] focus:outline-none focus:ring-1 focus:ring-[#38438f]"
        />
        <button
          type="submit"
          disabled={submitting || !newTaskTitle.trim()}
          className="rounded-md px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-[#2d3569] disabled:opacity-50"
          style={{ backgroundColor: '#38438f' }}
        >
          {submitting ? 'Adding…' : 'Add task'}
        </button>
      </form>

      <section>
        <h2 className="mb-4 text-xl font-semibold text-gray-900">To do</h2>
        {openTasks.length === 0 ? (
          <p className="rounded-lg border border-dashed border-gray-300 bg-white px-4 py-8 text-center text-sm text-gray-500">
            No open tasks yet. Add one above to get started.
          </p>
        ) : (
          <ul className={`space-y-3 ${draggedId ? 'select-none' : ''}`}>
            {openTasks.map((task) => {
              const isDragging = draggedId === task.id
              const isDragOver = dragOverId === task.id && draggedId !== task.id

              return (
                <li
                  key={task.id}
                  data-task-id={task.id}
                  className={`flex items-center gap-3 rounded-lg border-2 px-4 py-4 shadow-sm transition-all ${
                    isDragging ? 'opacity-50' : ''
                  } ${
                    isDragOver
                      ? 'border-red-500 bg-red-100'
                      : 'border-red-300 bg-red-50 hover:border-red-400'
                  }`}
                >
                  <div
                    role="button"
                    tabIndex={0}
                    data-drag-handle
                    onPointerDown={(event) => startDrag(event, task.id)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault()
                      }
                    }}
                    className="cursor-grab rounded p-1 text-red-400 hover:bg-red-100 active:cursor-grabbing touch-none"
                    aria-label={`Drag to reorder ${task.title}`}
                  >
                    <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path d="M7 4a1 1 0 1 1-2 0 1 1 0 0 1 2 0ZM7 10a1 1 0 1 1-2 0 1 1 0 0 1 2 0ZM7 16a1 1 0 1 1-2 0 1 1 0 0 1 2 0ZM13 4a1 1 0 1 1-2 0 1 1 0 0 1 2 0ZM13 10a1 1 0 1 1-2 0 1 1 0 0 1 2 0ZM13 16a1 1 0 1 1-2 0 1 1 0 0 1 2 0Z" />
                    </svg>
                  </div>

                  <input
                    type="checkbox"
                    checked={false}
                    onChange={() => void handleComplete(task.id)}
                    className="h-5 w-5 rounded border-red-400 text-green-600 focus:ring-green-500"
                    aria-label={`Mark ${task.title} as complete`}
                  />

                  <span className="flex-1 text-base font-medium text-red-950">
                    {editingTaskId === task.id ? (
                      <form
                        className="flex flex-col gap-2 sm:flex-row sm:items-center"
                        onSubmit={(event) => {
                          event.preventDefault()
                          void handleSaveEdit(task.id, 'OPEN')
                        }}
                      >
                        <input
                          type="text"
                          value={editingTitle}
                          onChange={(event) => setEditingTitle(event.target.value)}
                          autoFocus
                          disabled={savingEdit}
                          className="w-full rounded-md border border-red-300 bg-white px-3 py-1.5 text-base text-gray-900 focus:border-[#38438f] focus:outline-none focus:ring-1 focus:ring-[#38438f]"
                          aria-label="Edit task title"
                        />
                        <div className="flex gap-2">
                          <button
                            type="submit"
                            disabled={savingEdit || !editingTitle.trim()}
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
                      task.title
                    )}
                  </span>

                  {editingTaskId !== task.id && (
                    <button
                      type="button"
                      onClick={() => startEditing(task)}
                      className="rounded p-1.5 text-red-500 hover:bg-red-100"
                      aria-label={`Edit ${task.title}`}
                    >
                      <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                        <path d="m2.695 14.363 1.222-1.222a1 1 0 0 1 1.414 0l1.222 1.222a1 1 0 0 1 0 1.414l-1.222 1.222a1 1 0 0 1-1.414 0l-1.222-1.222a1 1 0 0 1 0-1.414ZM5.05 13.05l6.364-6.364 1.222 1.222-6.364 6.364-1.222-1.222ZM13.636 4.464l1.06-1.06a1.5 1.5 0 0 1 2.122 0l1.414 1.414a1.5 1.5 0 0 1 0 2.122l-1.06 1.06-2.476-2.476Z" />
                      </svg>
                    </button>
                  )}
                </li>
              )
            })}
          </ul>
        )}
      </section>

      <section>
        <h2 className="mb-4 text-xl font-semibold text-gray-900">Done</h2>
        {doneTasks.length === 0 ? (
          <p className="rounded-lg border border-dashed border-gray-300 bg-white px-4 py-8 text-center text-sm text-gray-500">
            Completed tasks will appear here.
          </p>
        ) : (
          <div className="overflow-hidden rounded-lg border border-green-200 bg-white shadow">
            <table className="min-w-full divide-y divide-green-100">
              <thead className="bg-green-50">
                <tr>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-green-800">
                    Task
                  </th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-green-800">
                    Completed
                  </th>
                  <th scope="col" className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-green-800">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-green-100">
                {doneTasks.map((task) => (
                  <tr key={task.id} className="bg-green-50/70">
                    <td className="px-4 py-3 text-sm font-medium text-green-900">
                      <div className="flex items-center gap-3">
                        <span className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded border border-green-500 bg-green-500 text-xs text-white">
                          ✓
                        </span>
                        {editingTaskId === task.id ? (
                          <form
                            className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-center"
                            onSubmit={(event) => {
                              event.preventDefault()
                              void handleSaveEdit(task.id, 'DONE')
                            }}
                          >
                            <input
                              type="text"
                              value={editingTitle}
                              onChange={(event) => setEditingTitle(event.target.value)}
                              autoFocus
                              disabled={savingEdit}
                              className="w-full rounded-md border border-green-300 bg-white px-3 py-1.5 text-sm text-gray-900 focus:border-[#38438f] focus:outline-none focus:ring-1 focus:ring-[#38438f]"
                              aria-label="Edit task title"
                            />
                            <div className="flex gap-2">
                              <button
                                type="submit"
                                disabled={savingEdit || !editingTitle.trim()}
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
                          <span>{task.title}</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-green-800">{formatDate(task.completedAt)}</td>
                    <td className="px-4 py-3 text-right">
                      {editingTaskId !== task.id && (
                        <button
                          type="button"
                          onClick={() => startEditing(task)}
                          className="rounded p-1.5 text-green-700 hover:bg-green-100"
                          aria-label={`Edit ${task.title}`}
                        >
                          <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                            <path d="m2.695 14.363 1.222-1.222a1 1 0 0 1 1.414 0l1.222 1.222a1 1 0 0 1 0 1.414l-1.222 1.222a1 1 0 0 1-1.414 0l-1.222-1.222a1 1 0 0 1 0-1.414ZM5.05 13.05l6.364-6.364 1.222 1.222-6.364 6.364-1.222-1.222ZM13.636 4.464l1.06-1.06a1.5 1.5 0 0 1 2.122 0l1.414 1.414a1.5 1.5 0 0 1 0 2.122l-1.06 1.06-2.476-2.476Z" />
                          </svg>
                        </button>
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
