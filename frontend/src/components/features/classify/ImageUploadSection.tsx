'use client'
import { useState, useCallback, useRef, useEffect } from 'react'
import Image from 'next/image'

interface Props {
  onUpload: (file: File) => void
}

export function ImageUploadSection({ onUpload }: Props) {
  const [preview, setPreview] = useState<string | null>(null)
  const [fileName, setFileName] = useState<string>('')
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview)
    }
  }, [preview])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file?.type.startsWith('image/')) {
      setPreview(URL.createObjectURL(file))
      setFileName(file.name)
      onUpload(file)
    }
  }, [onUpload])

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setPreview(URL.createObjectURL(file))
      setFileName(file.name)
      onUpload(file)
    }
  }

  const handleRemove = () => {
    setPreview(null)
    setFileName('')
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleClick = () => {
    fileInputRef.current?.click()
  }

  return (
    <div className="space-y-4">
      <div className="label">Product Image</div>
      <div
        onClick={handleClick}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={`classify-dropzone relative cursor-pointer rounded-3xl border-2 border-dashed p-8 text-center ${
          isDragging ? 'classify-dropzone-active' : ''
        }`}
      >
        {preview ? (
          <div className="space-y-3">
            <div className="relative mx-auto h-[180px] w-full max-w-[260px] overflow-hidden rounded-2xl border border-dark/45 bg-panel/70">
              <Image src={preview} alt="Preview" fill className="object-contain p-2" unoptimized />
            </div>
            <div className="truncate text-xs text-text-muted">{fileName}</div>
            <button
              onClick={(e) => { e.stopPropagation(); handleRemove() }}
              className="classify-chip rounded-full border border-dark/45 px-3 py-1.5 text-xs"
            >
              Remove Image
            </button>
          </div>
        ) : (
          <>
            <div className="mb-2 text-4xl">↑</div>
            <div className="mb-2 label justify-center">Drop Product Image</div>
            <div className="text-xs text-text-muted">or click to browse</div>
            <div className="mt-2 text-xs text-text-muted/70">Supports: JPG, PNG, WebP</div>
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
