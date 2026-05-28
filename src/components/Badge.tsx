type Variant = 'success' | 'warning' | 'danger' | 'info' | 'neutral'

const styles: Record<Variant, string> = {
  success: 'bg-green-50 text-green-700',
  warning: 'bg-amber-50 text-amber-700',
  danger:  'bg-red-50 text-red-600',
  info:    'bg-blue-50 text-blue-700',
  neutral: 'bg-gray-100 text-gray-600',
}

export default function Badge({
  variant = 'neutral',
  children,
}: {
  variant?: Variant
  children: React.ReactNode
}) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${styles[variant]}`}>
      {children}
    </span>
  )
}