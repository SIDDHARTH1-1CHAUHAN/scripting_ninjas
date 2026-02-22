'use client'

import type { ChangeEvent } from 'react'

interface Document {
  name: string
  status: 'required' | 'recommended' | 'uploaded' | 'verified'
  filename?: string
  uploadedAt?: string
}

interface DocumentChecklistProps {
  documents: Document[]
  onUpload?: (documentName: string, file: File) => Promise<void>
  uploadingDocument?: string | null
}

function formatUploadTime(value?: string): string {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleString()
}

export function DocumentChecklist({ documents, onUpload, uploadingDocument }: DocumentChecklistProps) {
  const statusIcon = {
    required: '◐',
    recommended: '○',
    uploaded: '⬆',
    verified: '☑',
  }

  const statusClass = {
    required: 'text-warning',
    recommended: 'opacity-70',
    uploaded: 'text-blue-600',
    verified: 'text-green-600',
  }

  const handleFileChange = async (
    event: ChangeEvent<HTMLInputElement>,
    documentName: string,
  ) => {
    const file = event.target.files?.[0]
    if (!file || !onUpload) return
    await onUpload(documentName, file)
    event.currentTarget.value = ''
  }

  return (
    <div className="border border-dark p-4">
      <div className="label mb-3">REQUIRED DOCUMENTS</div>
      <div className="space-y-3">
        {documents.map((doc, idx) => {
          const inputId = `doc-upload-${idx}`
          const isUploading = uploadingDocument === doc.name
          return (
            <div key={doc.name} className="border border-dark/20 p-3">
              <div className="flex items-center gap-2 text-sm">
                <span className={statusClass[doc.status]}>{statusIcon[doc.status]}</span>
                <span>{doc.name}</span>
                <span className="ml-auto text-xs opacity-60 uppercase">[{doc.status}]</span>
              </div>
              {(doc.filename || doc.uploadedAt) && (
                <div className="mt-2 text-xs opacity-70">
                  {doc.filename && <div>File: {doc.filename}</div>}
                  {doc.uploadedAt && <div>Uploaded: {formatUploadTime(doc.uploadedAt)}</div>}
                </div>
              )}
              {onUpload && (
                <div className="mt-3 flex items-center gap-3">
                  <input
                    id={inputId}
                    type="file"
                    className="hidden"
                    accept=".pdf,.png,.jpg,.jpeg,.txt,.doc,.docx"
                    onChange={(event) => handleFileChange(event, doc.name)}
                  />
                  <label
                    htmlFor={inputId}
                    className={`inline-flex cursor-pointer border border-dark px-3 py-1.5 text-xs font-pixel ${
                      isUploading ? 'opacity-50 pointer-events-none' : ''
                    }`}
                  >
                    {isUploading ? 'UPLOADING...' : 'UPLOAD'}
                  </label>
                  <span className="text-xs opacity-60">PDF, image, or text docs up to 10MB</span>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
