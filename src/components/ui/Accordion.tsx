'use client';

import { useState, ReactNode } from 'react';
import { ChevronDown } from 'lucide-react';

interface AccordionItem {
    title: string;
    content: ReactNode;
    icon?: ReactNode;
}

interface AccordionProps {
    items: AccordionItem[];
    allowMultiple?: boolean;
    defaultOpen?: number[];
    className?: string;
}

export default function Accordion({
    items,
    allowMultiple = false,
    defaultOpen = [],
    className = '',
}: AccordionProps) {
    const [openItems, setOpenItems] = useState<number[]>(defaultOpen);

    const toggleItem = (index: number) => {
        if (allowMultiple) {
            setOpenItems((prev) =>
                prev.includes(index)
                    ? prev.filter((i) => i !== index)
                    : [...prev, index]
            );
        } else {
            setOpenItems((prev) => (prev.includes(index) ? [] : [index]));
        }

        // Haptic feedback
        if ('vibrate' in navigator) {
            navigator.vibrate(10);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            toggleItem(index);
        }
    };

    return (
        <div className={`space-y-3 ${className}`}>
            {items.map((item, index) => {
                const isOpen = openItems.includes(index);

                return (
                    <div
                        key={index}
                        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden card-hover transition-all"
                    >
                        {/* Header */}
                        <button
                            onClick={() => toggleItem(index)}
                            onKeyDown={(e) => handleKeyDown(e, index)}
                            className="w-full flex items-center justify-between p-5 text-right hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-inset"
                            aria-expanded={isOpen}
                            aria-controls={`accordion-content-${index}`}
                        >
                            <div className="flex items-center gap-3 flex-1">
                                {item.icon && (
                                    <span className="text-emerald-600 dark:text-emerald-400 icon-hover-bounce">
                                        {item.icon}
                                    </span>
                                )}
                                <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">
                                    {item.title}
                                </h3>
                            </div>

                            <ChevronDown
                                size={20}
                                className={`text-slate-600 dark:text-slate-400 transition-transform duration-300 ${isOpen ? 'rotate-180' : 'rotate-0'
                                    }`}
                            />
                        </button>

                        {/* Content */}
                        <div
                            id={`accordion-content-${index}`}
                            className={`overflow-hidden transition-all duration-300 ${isOpen ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0'
                                }`}
                            aria-hidden={!isOpen}
                        >
                            <div className="p-5 pt-0 text-slate-600 dark:text-slate-400 animate-fadeIn">
                                {item.content}
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
