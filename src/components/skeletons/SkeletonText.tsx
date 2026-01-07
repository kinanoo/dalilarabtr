export default function SkeletonText({ lines = 3 }: { lines?: number }) {
    return (
        <div className="space-y-2 animate-pulse">
            {Array.from({ length: lines }).map((_, i) => (
                <div
                    key={i}
                    className="h-4 bg-slate-200 dark:bg-slate-800 rounded animate-shimmer"
                    style={{
                        width: i === lines - 1 ? '66%' : i % 2 === 0 ? '100%' : '90%',
                    }}
                ></div>
            ))}
        </div>
    );
}
