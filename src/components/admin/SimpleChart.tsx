'use client';

interface ChartProps {
    title: string;
    data: { label: string; value: number; color?: string }[];
    max?: number;
}

export default function SimpleChart({ title, data, max }: ChartProps) {
    const maxValue = max || Math.max(...data.map(d => d.value)) || 1;

    return (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
            <h3 className="font-bold text-slate-800 dark:text-slate-100 mb-6 flex items-center gap-2">
                {title}
            </h3>
            <div className="space-y-4">
                {data.map((item, idx) => {
                    const percentage = Math.round((item.value / maxValue) * 100);
                    return (
                        <div key={idx} className="group">
                            <div className="flex justify-between text-xs font-bold text-slate-500 mb-1">
                                <span className="truncate max-w-[70%]">{item.label}</span>
                                <span>{item.value}</span>
                            </div>
                            <div className="h-3 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                <div
                                    className={`h-full rounded-full transition-all duration-1000 ease-out group-hover:brightness-110 ${item.color || 'bg-emerald-500'}`}
                                    style={{ width: `${percentage}%` }}
                                />
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
