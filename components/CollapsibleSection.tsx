'use client'

import { useState } from 'react'

interface CollapsibleSectionProps {
  title: string
  children: React.ReactNode
}

export default function CollapsibleSection({ title, children }: CollapsibleSectionProps) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="border rounded-lg mb-4">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 transition-colors"
      >
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        <span className="text-2xl font-light" style={{ color: '#38438f' }}>
          {isOpen ? '−' : '+'}
        </span>
      </button>
      {isOpen && (
        <div className="p-4 pt-0 border-t">
          {children}
        </div>
      )}
    </div>
  )
}

