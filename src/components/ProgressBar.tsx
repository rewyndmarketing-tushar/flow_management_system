export default function ProgressBar({
  value,
  className = '',
}: {
  value: number
  className?: string
}) {
  return (
    <div className={`h-1.5 bg-gray-100 rounded-full overflow-hidden ${className}`}>
      <div
        className="h-full bg-gray-800 rounded-full transition-all duration-300"
        style={{ width: `${Math.min(100, Math.round(value))}%` }}
      />
    </div>
  )
}