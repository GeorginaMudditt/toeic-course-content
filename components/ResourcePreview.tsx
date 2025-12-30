'use client'

import { useState } from 'react'
import { jsPDF } from 'jspdf'
import html2canvas from 'html2canvas'

interface Resource {
  id: string
  title: string
  content: string
  type: string
  description?: string | null
  level?: string | null
}

interface ResourcePreviewProps {
  resource: Resource
}

export default function ResourcePreview({ resource }: ResourcePreviewProps) {
  const [downloading, setDownloading] = useState(false)
  const [linkCopied, setLinkCopied] = useState(false)

  const downloadPDF = async () => {
    // If content is already a PDF file, just download it directly
    if (resource.content.startsWith('/uploads/') || resource.content.startsWith('uploads/')) {
      const filePath = resource.content.startsWith('/') ? resource.content : `/${resource.content}`
      if (filePath.toLowerCase().endsWith('.pdf')) {
        const link = document.createElement('a')
        link.href = filePath
        link.download = resource.title + '.pdf'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        return
      }
    }

    // For HTML content or images, generate PDF
    const element = document.getElementById('resource-content')
    if (!element) return

    setDownloading(true)
    try {
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false
      })
      
      const imgData = canvas.toDataURL('image/png')
      const pdf = new jsPDF('p', 'mm', 'a4')
      const imgWidth = 210
      const pageHeight = 295
      const imgHeight = (canvas.height * imgWidth) / canvas.width
      let heightLeft = imgHeight

      let position = 0

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
      heightLeft -= pageHeight

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight
        pdf.addPage()
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
        heightLeft -= pageHeight
      }

      pdf.save(`${resource.title}.pdf`)
    } catch (error) {
      console.error('Failed to generate PDF:', error)
      alert('Failed to generate PDF. Please try again.')
    } finally {
      setDownloading(false)
    }
  }

  const handlePrint = () => {
    // If content is a PDF file, open it for printing
    if (resource.content.startsWith('/uploads/') || resource.content.startsWith('uploads/')) {
      const filePath = resource.content.startsWith('/') ? resource.content : `/${resource.content}`
      if (filePath.toLowerCase().endsWith('.pdf')) {
        window.open(filePath, '_blank')
        return
      }
    }

    // For HTML content or images, use print window
    const element = document.getElementById('resource-content')
    if (!element) return

    const printWindow = window.open('', '_blank')
    if (!printWindow) {
      alert('Please allow pop-ups to print this resource.')
      return
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${resource.title}</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              padding: 20px;
              margin: 0;
            }
            @media print {
              body { padding: 0; }
              @page { margin: 1cm; }
            }
            img {
              max-width: 100%;
              height: auto;
            }
          </style>
        </head>
        <body>
          ${element.innerHTML}
        </body>
      </html>
    `)
    printWindow.document.close()
    printWindow.focus()
    setTimeout(() => {
      printWindow.print()
      printWindow.close()
    }, 250)
  }

  const copyShareLink = async () => {
    const shareUrl = `${window.location.origin}/teacher/resources/${resource.id}/preview`
    try {
      await navigator.clipboard.writeText(shareUrl)
      setLinkCopied(true)
      setTimeout(() => setLinkCopied(false), 2000)
    } catch (error) {
      console.error('Failed to copy link:', error)
      alert('Failed to copy link. Please copy it manually.')
    }
  }

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <div className="flex justify-between items-center mb-4 flex-wrap gap-4">
        <div className="flex items-center space-x-3 flex-wrap">
          <button
            onClick={downloadPDF}
            disabled={downloading}
            className="px-4 py-2 text-white rounded-md disabled:opacity-50 transition-colors hover:bg-[#2d3569]"
            style={{ backgroundColor: '#38438f' }}
          >
            {downloading ? 'Generating PDF...' : (resource.content.startsWith('/uploads/') && resource.content.toLowerCase().endsWith('.pdf') ? '📥 Download PDF' : '📥 Download PDF')}
          </button>
          <button
            onClick={handlePrint}
            className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
          >
            🖨️ Print
          </button>
          <button
            onClick={copyShareLink}
            className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors"
          >
            {linkCopied ? '✓ Link Copied!' : '🔗 Share Link'}
          </button>
        </div>
        <div className="text-sm text-gray-500">
          <span className="font-medium">Type:</span> {resource.type}
          {resource.level && (
            <>
              {' | '}
              <span className="font-medium">Level:</span> {resource.level}
            </>
          )}
        </div>
      </div>

      <div id="resource-content" className="border rounded-lg p-6 bg-white mb-4">
        {resource.content.startsWith('/uploads/') || resource.content.startsWith('uploads/') ? (
          // File-based content (PDF or Image)
          (() => {
            const filePath = resource.content.startsWith('/') ? resource.content : `/${resource.content}`
            const isPDF = filePath.toLowerCase().endsWith('.pdf')
            const isImage = /\.(png|jpg|jpeg)$/i.test(filePath)
            
            if (isPDF) {
              return (
                <iframe
                  src={filePath}
                  className="w-full h-[800px] border-0"
                  title={resource.title}
                />
              )
            } else if (isImage) {
              return (
                <img
                  src={filePath}
                  alt={resource.title}
                  className="max-w-full h-auto mx-auto"
                />
              )
            } else {
              return <p className="text-gray-500">Unsupported file type</p>
            }
          })()
        ) : (
          // HTML content
          <div 
            className="prose max-w-none"
            dangerouslySetInnerHTML={{ __html: resource.content }}
          />
        )}
      </div>

      <div className="mt-4 text-sm text-gray-500 bg-gray-50 p-4 rounded-lg">
        <p className="font-medium mb-2">💡 Teacher Preview</p>
        <p>This is how students will see this resource. You can download it as PDF, print it, or share the preview link.</p>
      </div>
    </div>
  )
}

