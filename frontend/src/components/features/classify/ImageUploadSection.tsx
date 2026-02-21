'use client'
import { useState, useCallback, useRef } from 'react'

interface Props {
  onUpload: (file: File) => void
}

export function ImageUploadSection({ onUpload }: Props) {
  const [preview, setPreview] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file?.type.startsWith('image/')) {
      setPreview(URL.createObjectURL(file))
      onUpload(file)
    }
  }, [onUpload])

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setPreview(URL.createObjectURL(file))
      onUpload(file)
    }
  }

  const handleRemove = () => {
    setPreview(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleClick = () => {
    fileInputRef.current?.click()
  }

  return (
    <div className="space-y-4">
      <div className="label">PRODUCT_IMAGE</div>
      <div
        onClick={handleClick}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={`relative border-2 border-dashed p-8 text-center transition-colors cursor-pointer ${
          isDragging ? 'border-dark bg-dark/5' : 'border-[#888] hover:border-dark'
        }`}
      >
        {preview ? (
          <div>
            <img src={preview} alt="Preview" className="max-h-48 mx-auto mb-4 object-contain" />
            <button
              onClick={(e) => { e.stopPropagation(); handleRemove() }}
              className="text-xs underline hover:text-dark"
            >
              REMOVE_IMAGE
            </button>
          </div>
        ) : (
          <>
            <div className="text-4xl mb-2">↑</div>
            <div className="label justify-center mb-2">DROP PRODUCT IMAGE</div>
            <div className="text-xs opacity-60">or click to browse</div>
            <div className="text-xs opacity-40 mt-2">Supports: JPG, PNG, WebP</div>
          </>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>
    </div>
  )
}
