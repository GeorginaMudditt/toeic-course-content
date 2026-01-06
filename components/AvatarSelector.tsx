'use client'

import { useState, useRef } from 'react'
import { useSession } from 'next-auth/react'

interface AvatarSelectorProps {
  currentAvatar?: string | null
  onAvatarChange?: (avatar: string) => void
  onClose?: () => void
}

const POPULAR_EMOJIS = [
  '😀', '😃', '😄', '😁', '😆', '😅', '🤣', '😂',
  '🙂', '🙃', '😉', '😊', '😇', '🥰', '😍', '🤩',
  '😎', '🤗', '🤔', '😐', '😑', '😶', '🙄', '😏',
  '😣', '😥', '😮', '🤐', '😯', '😪', '😫', '🥱',
  '😴', '😌', '😛', '😜', '😝', '🤤', '😒', '😓',
  '😔', '😕', '🙃', '🤑', '😲', '☹️', '🙁', '😖',
  '😞', '😟', '😤', '😢', '😭', '😦', '😧', '😨',
  '😩', '🤯', '😬', '😰', '😱', '🥵', '🥶', '😳',
  '🤪', '😵', '😡', '😠', '🤬', '😷', '🤒', '🤕',
  '🤢', '🤮', '🤧', '🥴', '😵', '🤯', '🤠', '🥳',
  '😸', '😹', '😻', '😼', '😽', '🙀', '😿', '😾'
]

export default function AvatarSelector({ currentAvatar, onAvatarChange, onClose }: AvatarSelectorProps) {
  const { data: session } = useSession()
  const [uploading, setUploading] = useState(false)
  const [selectedEmoji, setSelectedEmoji] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/avatar/upload', {
        method: 'POST',
        body: formData
      })

      if (response.ok) {
        const data = await response.json()
        console.log('Avatar uploaded successfully:', data)
        onAvatarChange?.(data.path)
        onClose?.()
      } else {
        const error = await response.json()
        console.error('Failed to upload avatar:', error)
        alert(error.error || 'Failed to upload avatar')
      }
    } catch (error) {
      console.error('Error uploading avatar:', error)
      alert('Failed to upload avatar')
    } finally {
      setUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleEmojiSelect = async (emoji: string) => {
    setSelectedEmoji(emoji)
    try {
      const response = await fetch('/api/avatar', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ avatar: emoji })
      })

      if (response.ok) {
        const data = await response.json()
        console.log('Avatar updated successfully:', data)
        onAvatarChange?.(emoji)
        onClose?.()
      } else {
        const error = await response.json()
        console.error('Failed to update avatar:', error)
        alert(error.error || 'Failed to update avatar')
      }
    } catch (error) {
      console.error('Error updating avatar:', error)
      alert('Failed to update avatar')
    }
  }

  return (
    <div className="p-6 bg-white rounded-lg shadow-lg max-w-md w-full">
      <h3 className="text-lg font-semibold mb-4" style={{ color: '#38438f' }}>
        Choose Your Avatar
      </h3>

      {/* Upload Section */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Upload Photo
        </label>
        <div className="flex items-center space-x-4">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/jpg,image/gif,image/webp"
            onChange={handleFileSelect}
            className="hidden"
            id="avatar-upload"
          />
          <label
            htmlFor="avatar-upload"
            className="cursor-pointer px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            {uploading ? 'Uploading...' : 'Choose File'}
          </label>
          <span className="text-xs text-gray-500">Max 2MB</span>
        </div>
      </div>

      {/* Emoji Section */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Or Choose an Emoji
        </label>
        <div className="grid grid-cols-8 gap-2 max-h-64 overflow-y-auto p-2 border border-gray-200 rounded-md">
          {POPULAR_EMOJIS.map((emoji, index) => (
            <button
              key={index}
              onClick={() => handleEmojiSelect(emoji)}
              className={`text-2xl p-2 rounded hover:bg-gray-100 transition-colors ${
                selectedEmoji === emoji ? 'bg-blue-100 ring-2 ring-blue-500' : ''
              }`}
              title={emoji}
            >
              {emoji}
            </button>
          ))}
        </div>
      </div>

      {onClose && (
        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900"
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  )
}
