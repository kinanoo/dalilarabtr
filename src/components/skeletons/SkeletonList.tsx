import SkeletonCard from './SkeletonCard';

export default function SkeletonList({ count = 3 }: { count?: number }) {
    return (
        <div className="space-y-4">
            {Array.from({ length: count }).map((_, i) => (
                <div key={i} className="stagger-item" style={{ animationDelay: `${i * 0.1}s` }}>
                    <SkeletonCard />
                </div>
            ))}
        </div>
    );
}
