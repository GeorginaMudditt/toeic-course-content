'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { createRoot } from 'react-dom/client'
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
  showActions?: boolean
}

// Inline answer input component for placement test (same as WorksheetViewer)
function InlineAnswerInput({ 
  answerPath, 
  value, 
  onChange, 
  type = 'radio' 
}: { 
  answerPath: string
  value: string
  onChange: (value: string) => void
  type?: 'radio' | 'text' | 'textarea'
}) {
  const [localValue, setLocalValue] = useState(value)
  
  if (type === 'radio') {
    return (
      <div style={{ 
        display: 'inline-flex', 
        alignItems: 'center', 
        gap: '8px',
        pointerEvents: 'auto',
        zIndex: 10,
        position: 'relative'
      }}>
        {['A', 'B', 'C', 'D'].map((option) => (
          <label 
            key={option} 
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '4px', 
              cursor: 'pointer',
              pointerEvents: 'auto'
            }}
            onClick={(e) => {
              // Don't prevent default - allow native label behavior to trigger radio
              e.stopPropagation()
              setLocalValue(option)
              onChange(option)
            }}
          >
            <input
              type="radio"
              name={answerPath}
              value={option}
              checked={localValue === option}
              onChange={(e) => {
                // Don't prevent default - allow native radio behavior
                e.stopPropagation()
                setLocalValue(e.target.value)
                onChange(e.target.value)
              }}
              style={{ 
                width: '16px', 
                height: '16px', 
                cursor: 'pointer',
                pointerEvents: 'auto'
              }}
            />
            <span style={{ fontSize: '13px', pointerEvents: 'none' }}>{option}</span>
          </label>
        ))}
      </div>
    )
  } else if (type === 'text') {
    return (
      <input
        type="text"
        value={localValue}
        onChange={(e) => {
          e.stopPropagation()
          setLocalValue(e.target.value)
          onChange(e.target.value)
        }}
        onKeyDown={(e) => {
          e.stopPropagation()
          if (e.key === 'Enter') {
            e.preventDefault()
          }
        }}
        onClick={(e) => {
          e.stopPropagation()
        }}
        style={{
          border: '1px solid #d1d5db',
          borderRadius: '4px',
          padding: '4px 8px',
          fontSize: '13px',
          width: '120px',
          marginLeft: '8px',
          pointerEvents: 'auto'
        }}
        placeholder="Answer"
      />
    )
  } else {
    return (
      <textarea
        value={localValue || ''}
        onChange={(e) => {
          e.stopPropagation()
          setLocalValue(e.target.value)
          onChange(e.target.value)
        }}
        onClick={(e) => {
          e.stopPropagation()
        }}
        style={{
          width: '100%',
          border: '1px solid #d1d5db',
          borderRadius: '4px',
          padding: '8px',
          fontSize: '13px',
          fontFamily: 'inherit',
          minHeight: '150px',
          resize: 'vertical',
          pointerEvents: 'auto',
          zIndex: 2,
          position: 'relative'
        }}
        placeholder="Type your written response here..."
      />
    )
  }
}

export default function ResourcePreview({ resource, showActions = true }: ResourcePreviewProps) {
  const [downloading, setDownloading] = useState(false)
  const contentRef = useRef<HTMLDivElement>(null)
  
  // Check if this is a Placement Test
  const isPlacementTest = resource.title.toLowerCase().includes('placement test')
  
  // Inject inline answer inputs into HTML content (same logic as WorksheetViewer)
  useEffect(() => {
    if (!isPlacementTest || !contentRef.current) return
    
    // Use MutationObserver to wait for HTML content to be inserted
    const observer = new MutationObserver(() => {
      if (!contentRef.current) return
      
      // Look for answer inputs in the entire contentRef, including nested divs
      const answerInputs = contentRef.current.querySelectorAll('[data-answer-input]')
      
      if (answerInputs.length === 0) {
        // Try again after a short delay - HTML might still be rendering
        return
      }
      
      // Disconnect observer once we find the elements
      observer.disconnect()
      
      answerInputs.forEach((container) => {
        const answerPath = container.getAttribute('data-answer-input')
        if (!answerPath) return
        
        // Skip if already rendered
        if ((container as any)._reactRoot) return
        
        // Determine input type
        let inputType: 'radio' | 'text' | 'textarea' = 'radio'
        if (answerPath === 'writing') {
          inputType = 'textarea'
        } else if (answerPath.includes('incompleteSentences')) {
          inputType = 'text'
        }
        
        // Create React root and render component (interactive for preview)
        try {
          container.innerHTML = ''
          const containerEl = container as HTMLElement
          containerEl.style.pointerEvents = 'auto'
          containerEl.style.position = 'relative'
          containerEl.style.zIndex = '10'
          const root = createRoot(containerEl)
          root.render(
            <InlineAnswerInput
              answerPath={answerPath}
              value=""
              onChange={() => {}} // No-op for preview (doesn't save)
              type={inputType}
            />
          )
          ;(container as any)._reactRoot = root
        } catch (error) {
          console.error('Error rendering inline answer input:', error, answerPath)
        }
      })
    })
    
    // Start observing
    if (contentRef.current) {
      observer.observe(contentRef.current, {
        childList: true,
        subtree: true
      })
    }
    
    // Also try immediately in case HTML is already rendered
    const timeoutId = setTimeout(() => {
      if (!contentRef.current) return
      
      const answerInputs = contentRef.current.querySelectorAll('[data-answer-input]')
      
      if (answerInputs.length === 0) return
      
      answerInputs.forEach((container) => {
        const answerPath = container.getAttribute('data-answer-input')
        if (!answerPath) return
        
        // Skip if already rendered
        if ((container as any)._reactRoot) return
        
        // Determine input type
        let inputType: 'radio' | 'text' | 'textarea' = 'radio'
        if (answerPath === 'writing') {
          inputType = 'textarea'
        } else if (answerPath.includes('incompleteSentences')) {
          inputType = 'text'
        }
        
        // Create React root and render component (read-only for preview)
        try {
          container.innerHTML = ''
          const containerEl = container as HTMLElement
          containerEl.style.pointerEvents = 'auto'
          containerEl.style.position = 'relative'
          containerEl.style.zIndex = '10'
          const root = createRoot(containerEl)
          root.render(
            <InlineAnswerInput
              answerPath={answerPath}
              value=""
              onChange={() => {}} // No-op for preview (doesn't save)
              type={inputType}
            />
          )
          ;(container as any)._reactRoot = root
        } catch (error) {
          console.error('Error rendering inline answer input:', error, answerPath)
        }
      })
    }, 500)
    
    // Cleanup function
    return () => {
      clearTimeout(timeoutId)
      observer.disconnect()
      if (contentRef.current) {
        const answerInputs = contentRef.current.querySelectorAll('[data-answer-input]')
        answerInputs.forEach((container) => {
          const root = (container as any)._reactRoot
          if (root) {
            try {
              root.unmount()
            } catch (error) {
              // Ignore unmount errors
            }
          }
        })
      }
    }
  }, [isPlacementTest, resource.content])

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
      // Check if content has page-break divs (each page is wrapped in a div with class "page-break")
      const pageBreakElements = element.querySelectorAll('div.page-break')
      
      if (pageBreakElements.length > 0) {
        // Render each page separately to respect page breaks
        const pdf = new jsPDF('p', 'mm', 'a4')
        const imgWidth = 210
        const pageHeight = 295
        
        for (let i = 0; i < pageBreakElements.length; i++) {
          const pageElement = pageBreakElements[i] as HTMLElement
          
          // Create a temporary container for this page with same styling
          const tempContainer = document.createElement('div')
          tempContainer.style.position = 'absolute'
          tempContainer.style.left = '-9999px'
          tempContainer.style.width = element.offsetWidth + 'px'
          tempContainer.style.backgroundColor = '#ffffff'
          tempContainer.style.padding = '20px'
          tempContainer.style.fontFamily = 'Arial, sans-serif'
          
          // Clone the page element
          const clonedPage = pageElement.cloneNode(true) as HTMLElement
          tempContainer.appendChild(clonedPage)
          document.body.appendChild(tempContainer)
          
          const canvas = await html2canvas(tempContainer, {
            scale: 2,
            useCORS: true,
            logging: false,
            backgroundColor: '#ffffff',
            width: tempContainer.offsetWidth,
            height: tempContainer.offsetHeight
          })
          
          document.body.removeChild(tempContainer)
          
          const imgData = canvas.toDataURL('image/png')
          const imgHeight = (canvas.height * imgWidth) / canvas.width
          
          if (i > 0) {
            pdf.addPage()
          }
          
          // If content fits on one page, add it
          if (imgHeight <= pageHeight) {
            pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight)
          } else {
            // If content is taller than one page, split it
            let heightLeft = imgHeight
            let position = 0
            
            pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
            heightLeft -= pageHeight
            
            while (heightLeft > 0) {
              position = heightLeft - imgHeight
              pdf.addPage()
              pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
              heightLeft -= pageHeight
            }
          }
        }
        
        pdf.save(`${resource.title}.pdf`)
      } else {
        // Original approach for content without page breaks
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
      }
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

  return (
    <div className="bg-white shadow rounded-lg p-6">
      {showActions && (
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
      )}

      <div id="resource-content" ref={contentRef} className="border rounded-lg p-6 bg-white mb-4">
        {(() => {
          // Check if content is JSON (PDF with audio)
          let contentData: any = null
          try {
            if (resource.content.startsWith('{')) {
              contentData = JSON.parse(resource.content)
            }
          } catch (e) {
            // Not JSON, continue with normal handling
          }

          if (contentData && contentData.type === 'pdf-with-audio') {
            // PDF with audio files
            return (
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-2">PDF Document</h3>
                  <iframe
                    src={contentData.pdf}
                    className="w-full h-[800px] border-0"
                    title={resource.title}
                  />
                </div>
                {contentData.audio && contentData.audio.length > 0 && (
                  <div className="border-t pt-4">
                    <h3 className="text-sm font-medium text-gray-700 mb-3">Audio Files</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {contentData.audio.map((audio: any, index: number) => (
                        <div key={index} className="bg-gray-50 p-4 rounded-lg border">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-gray-700">
                              Audio {audio.code}
                            </span>
                            <span className="text-xs text-gray-500">{audio.filename}</span>
                          </div>
                          <audio
                            controls
                            className="w-full"
                            src={audio.path}
                          >
                            Your browser does not support the audio element.
                          </audio>
                        </div>
                      ))}
                    </div>
                    <p className="mt-2 text-xs text-gray-500">
                      Match the audio codes (A1, A2, etc.) with the icons on the PDF above.
                    </p>
                  </div>
                )}
              </div>
            )
          } else if (resource.content.startsWith('/uploads/') || resource.content.startsWith('uploads/')) {
            // File-based content (PDF or Image)
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
          } else {
            // HTML content
            return (
              <div 
                className="prose max-w-none"
                dangerouslySetInnerHTML={{ __html: resource.content }}
              />
            )
          }
        })()}
      </div>

      {showActions && (
        <div className="mt-4 text-sm text-gray-500 bg-gray-50 p-4 rounded-lg">
          <p className="font-medium mb-2">💡 Teacher Preview</p>
          <p>This is how students will see this resource. You can download it as PDF, print it, or share the preview link.</p>
        </div>
      )}
    </div>
  )
}

