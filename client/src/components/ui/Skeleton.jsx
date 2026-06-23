export function Skeleton({ className = '' }) {
  return <div className={`skeleton rounded-md ${className}`} aria-hidden="true" />
}

export function BookCoverSkeleton() {
  return <Skeleton className="aspect-[2/3] w-full rounded-md shadow-book" />
}

export function CardSkeleton() {
  return (
    <div className="space-y-3 p-4">
      <Skeleton className="h-4 w-2/3" />
      <Skeleton className="h-3 w-full" />
      <Skeleton className="h-3 w-5/6" />
    </div>
  )
}
