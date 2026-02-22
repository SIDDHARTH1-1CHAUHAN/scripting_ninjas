interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
}

export function Textarea({ label, className = '', ...props }: TextareaProps) {
  return (
    <div>
      {label && <div className="label mb-1">{label}</div>}
      <textarea
        className={`w-full bg-transparent border border-dark p-3 focus:outline-none focus:border-2 resize-none rounded-sm shadow-[var(--surface-shadow)] ${className}`}
        {...props}
      />
    </div>
  )
}
