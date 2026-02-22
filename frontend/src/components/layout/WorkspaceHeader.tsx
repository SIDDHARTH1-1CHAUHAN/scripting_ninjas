interface Props {
  title: string
  pixelTitle: string
  metaLabel: string
  metaValue: string
}

export function WorkspaceHeader({ title, pixelTitle, metaLabel, metaValue }: Props) {
  return (
    <header className="p-4 lg:p-6 border-b-2 border-dark bg-canvas/85 backdrop-blur-md flex justify-between items-end shrink-0 gap-4 relative rounded-b-3xl">
      <div className="absolute inset-x-0 top-0 h-[2px] bg-[var(--accent-soft)]" />
      <div>
        <div className="label">ACTIVE MODULE</div>
        <h1 className="workspace-module-title text-3xl lg:text-5xl">
          {title}<br/>
          <span className="workspace-module-accent">{pixelTitle}</span>
        </h1>
      </div>
      <div className="text-right">
        <div className="label">{metaLabel}</div>
        <div className="font-pixel text-xs lg:text-sm border border-dark px-3 py-1.5 inline-block bg-panel/70 shadow-[var(--surface-shadow)] rounded-full">
          {metaValue}
        </div>
      </div>
    </header>
  )
}
