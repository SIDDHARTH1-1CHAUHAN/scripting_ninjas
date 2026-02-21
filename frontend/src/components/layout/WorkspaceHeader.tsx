interface Props {
  title: string
  pixelTitle: string
  metaLabel: string
  metaValue: string
}

export function WorkspaceHeader({ title, pixelTitle, metaLabel, metaValue }: Props) {
  return (
    <header className="p-6 border-b-2 border-dark bg-canvas flex justify-between items-end shrink-0">
      <div>
        <div className="label">ACTIVE MODULE</div>
        <h1 className="text-5xl font-bold leading-none">
          {title}<br/>
          <span className="font-pixel">{pixelTitle}</span>
        </h1>
      </div>
      <div className="text-right">
        <div className="label">{metaLabel}</div>
        <div className="font-pixel text-sm">{metaValue}</div>
      </div>
    </header>
  )
}
