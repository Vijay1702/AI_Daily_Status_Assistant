interface SkeletonProps {
  className?: string;
  count?: number;
}

export default function Skeleton({ className = 'h-4 w-full', count = 1 }: SkeletonProps) {
  return (
    <div className="space-y-2">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className={`bg-gray-200 rounded animate-pulse ${className}`} />
      ))}
    </div>
  );
}
