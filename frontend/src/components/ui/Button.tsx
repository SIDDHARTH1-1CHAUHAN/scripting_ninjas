interface Props extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary'
}

export function Button({ children, variant = 'primary', className = '', ...props }: Props) {
  const styles = {
    primary: 'bg-dark text-canvas hover:opacity-90',
    secondary: 'bg-transparent border-2 border-dark hover:bg-dark hover:text-canvas',
  }

  return (
    <button
      className={`font-pixel px-6 py-4 transition-all ${styles[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}
