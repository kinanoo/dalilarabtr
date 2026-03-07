'use client';

const CITIES = [
    { name: 'إسطنبول', x: 190, y: 68, size: 'lg' },
    { name: 'أنقرة', x: 260, y: 95, size: 'md' },
    { name: 'إزمير', x: 155, y: 125, size: 'md' },
    { name: 'غازي عنتاب', x: 340, y: 140, size: 'md' },
    { name: 'أنطاليا', x: 225, y: 155, size: 'sm' },
] as const;

export default function TurkeyMap() {
    return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none z-[5]" aria-hidden="true">
            <svg
                viewBox="0 0 500 220"
                className="absolute left-0 top-1/2 -translate-y-1/2 w-[60%] max-w-[500px] opacity-[0.07] lg:opacity-[0.12]"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
            >
                {/* Turkey outline — simplified */}
                <path
                    d="M60,95 L75,80 L95,75 L110,80 L125,72 L140,68 L155,72 L170,65 L185,60 L195,55 L210,58 L220,52 L230,55 L240,60 L250,58 L265,62 L280,58 L295,55 L310,58 L325,62 L340,58 L355,55 L370,58 L385,62 L400,58 L415,55 L430,60 L440,65 L445,75 L440,85 L445,95 L440,105 L445,115 L440,125 L430,135 L420,140 L405,145 L390,148 L375,150 L360,148 L345,152 L330,155 L315,152 L300,148 L285,152 L270,155 L255,152 L240,148 L225,155 L210,160 L195,155 L180,150 L165,148 L150,145 L135,140 L120,138 L105,135 L90,130 L80,125 L70,118 L65,110 L60,100 Z"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    className="text-emerald-400"
                    fill="currentColor"
                    fillOpacity="0.05"
                />

                {/* City dots with pulse animation */}
                {CITIES.map((city, i) => (
                    <g key={city.name}>
                        {/* Pulse ring */}
                        <circle
                            cx={city.x}
                            cy={city.y}
                            r={city.size === 'lg' ? 12 : city.size === 'md' ? 9 : 7}
                            className="text-emerald-400"
                            fill="currentColor"
                            opacity="0"
                        >
                            <animate
                                attributeName="opacity"
                                values="0.6;0"
                                dur="2.5s"
                                begin={`${i * 0.5}s`}
                                repeatCount="indefinite"
                            />
                            <animate
                                attributeName="r"
                                values={city.size === 'lg' ? '4;16' : city.size === 'md' ? '3;12' : '3;10'}
                                dur="2.5s"
                                begin={`${i * 0.5}s`}
                                repeatCount="indefinite"
                            />
                        </circle>
                        {/* Solid dot */}
                        <circle
                            cx={city.x}
                            cy={city.y}
                            r={city.size === 'lg' ? 4 : city.size === 'md' ? 3 : 2.5}
                            className="text-emerald-400"
                            fill="currentColor"
                        />
                    </g>
                ))}
            </svg>
        </div>
    );
}
