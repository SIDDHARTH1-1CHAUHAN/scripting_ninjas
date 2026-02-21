interface Document {
  name: string
  status: 'verified' | 'missing' | 'pending'
}

export function DocumentChecklist({ documents }: { documents: Document[] }) {
  const statusIcon = {
    verified: '☑',
    missing: '☐',
    pending: '◐',
  }

  return (
    <div className="border border-dark p-4">
      <div className="label mb-3">REQUIRED DOCUMENTS</div>
      <div className="space-y-2">
        {documents.map((doc) => (
          <div key={doc.name} className="flex items-center gap-2 text-sm">
            <span className={doc.status === 'verified' ? 'text-green-500' : doc.status === 'missing' ? 'text-warning' : ''}>
              {statusIcon[doc.status]}
            </span>
            <span>{doc.name}</span>
            <span className="ml-auto text-xs opacity-60 uppercase">[{doc.status}]</span>
          </div>
        ))}
      </div>
    </div>
  )
}
