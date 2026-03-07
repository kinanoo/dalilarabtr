'use client';

// Real Turkey outline from simple-world-map (CC license)
// viewBox calibrated to the path's bounding box
const TURKEY_PATH = "M472.812,421.906l-2.305-1.426l-1.271-1.013l-2.138,0.916l0,0l-1.477,3.74l2.219-0.5l1.562-1.188l3.438,0.938l-1.946,1.877L465.719,425l-1.91,2.093v1.021l1.22,1.021v1.123l-0.511,1.332l0.511,1.123l1.625-0.812l1.625,1.737l-0.406,1.228l-0.604,0.82l0.907,1.021l4.461,0.916l3.139-1.331v-1.937l1.521,0.303l3.648,2.144l3.948-0.614l1.721-1.633l1.114,0.406v1.841h1.521l1.313-2.55l11.549-1.229l5.04-0.613l-1.331-1.746l-0.025-2.359l1.011-1.21l-3.682-2.956l0.197-2.551h-2.022l-3.354-1.643l0,0l-1.929,2.041l-7.088-0.209l-4.253-2.549l-4.082,0.366l-4.544,2.729L472.812,421.906z";

const CITIES = [
    { name: 'إسطنبول', cx: 472, cy: 422, size: 'lg' as const },
    { name: 'أنقرة', cx: 486, cy: 425, size: 'md' as const },
    { name: 'إزمير', cx: 466, cy: 430, size: 'md' as const },
    { name: 'غازي عنتاب', cx: 499, cy: 431, size: 'md' as const },
    { name: 'أنطاليا', cx: 477, cy: 435, size: 'sm' as const },
];

export default function TurkeyMap() {
    return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none z-[5]" aria-hidden="true">
            <svg
                viewBox="460 416 52 24"
                className="absolute left-0 top-1/2 -translate-y-1/2 w-[70%] max-w-[600px] opacity-[0.15] lg:opacity-[0.2]"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                preserveAspectRatio="xMidYMid meet"
            >
                {/* Turkey real geographic outline */}
                <path
                    d={TURKEY_PATH}
                    stroke="currentColor"
                    strokeWidth="0.3"
                    className="text-emerald-400"
                    fill="currentColor"
                    fillOpacity="0.08"
                    strokeLinejoin="round"
                />

                {/* City dots with pulse animation */}
                {CITIES.map((city, i) => {
                    const r = city.size === 'lg' ? 0.8 : city.size === 'md' ? 0.6 : 0.5;
                    const pulseR = city.size === 'lg' ? '0.8;3' : city.size === 'md' ? '0.6;2.5' : '0.5;2';
                    return (
                        <g key={city.name}>
                            <circle cx={city.cx} cy={city.cy} r={r} className="text-emerald-400" fill="currentColor" opacity="0">
                                <animate attributeName="opacity" values="0.7;0" dur="2.5s" begin={`${i * 0.5}s`} repeatCount="indefinite" />
                                <animate attributeName="r" values={pulseR} dur="2.5s" begin={`${i * 0.5}s`} repeatCount="indefinite" />
                            </circle>
                            <circle cx={city.cx} cy={city.cy} r={r} className="text-emerald-400" fill="currentColor" />
                        </g>
                    );
                })}
            </svg>
        </div>
    );
}
