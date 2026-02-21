interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
}

export function Input({ label, className = '', ...props }: InputProps) {
  return (
    <div>
      {label && <div className="label mb-1">{label}</div>}
      <input
        className={`w-full bg-transparent border border-dark p-3 focus:outline-none focus:border-2 ${className}`}
        {...props}
      />
    </div>
  )
}
