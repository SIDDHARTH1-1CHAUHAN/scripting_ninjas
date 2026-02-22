interface Props extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary'
}

export function Button({ children, variant = 'primary', className = '', ...props }: Props) {
  const styles = {
    primary: 'inline-flex items-center justify-center min-h-[52px] bg-dark text-text-inv hover:opacity-95 border-2 border-text-inv/50 shadow-[var(--surface-shadow)]',
    secondary: 'bg-transparent border-2 border-dark hover:bg-dark hover:text-text-inv',
  }

  return (
    <button
      className={`font-pixel px-6 py-3.5 rounded-sm transition-all duration-200 active:scale-[0.99] disabled:opacity-55 disabled:cursor-not-allowed ${styles[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}
