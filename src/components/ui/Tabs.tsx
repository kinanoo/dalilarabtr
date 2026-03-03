'use client';

import { useState, ReactNode } from 'react';

interface Tab {
    label: string;
    icon?: ReactNode;
    content: ReactNode;
    badge?: number;
}

interface TabsProps {
    tabs: Tab[];
    defaultTab?: number;
    variant?: 'default' | 'pills' | 'underline';
    className?: string;
}

export default function Tabs({
    tabs,
    defaultTab = 0,
    variant = 'default',
    className = '',
}: TabsProps) {
    const [activeTab, setActiveTab] = useState(defaultTab);

    const handleTabClick = (index: number) => {
        setActiveTab(index);

        // Haptic feedback
        if ('vibrate' in navigator) {
            navigator.vibrate(10);
        }
    };

    const getTabClasses = (index: number) => {
        const isActive = activeTab === index;
        const baseClasses = 'relative flex items-center gap-2 px-3 sm:px-6 py-2.5 sm:py-3 text-sm sm:text-base font-bold transition-all focus:outline-none focus:ring-2 focus:ring-emerald-500 whitespace-nowrap shrink-0';

        if (variant === 'pills') {
            return `${baseClasses} rounded-lg ${isActive
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`;
        }

        if (variant === 'underline') {
            return `${baseClasses} border-b-2 ${isActive
                    ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
                    : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`;
        }

        // default variant
        return `${baseClasses} rounded-t-lg ${isActive
                ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 border-t-2 border-x-2 border-emerald-600'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`;
    };

    return (
        <div className={className}>
            {/* Tab Headers */}
            <div className={`flex gap-1 sm:gap-2 overflow-x-auto scrollbar-hide ${variant === 'underline' ? 'border-b border-slate-200 dark:border-slate-800' : ''}`}>
                {tabs.map((tab, index) => (
                    <button
                        key={index}
                        onClick={() => handleTabClick(index)}
                        className={getTabClasses(index)}
                        role="tab"
                        aria-selected={activeTab === index}
                        aria-controls={`tab-panel-${index}`}
                    >
                        {tab.icon && (
                            <span className={activeTab === index ? 'icon-hover-bounce' : ''}>
                                {tab.icon}
                            </span>
                        )}
                        <span>{tab.label}</span>

                        {tab.badge !== undefined && tab.badge > 0 && (
                            <span className="flex items-center justify-center min-w-[20px] h-5 px-1.5 bg-red-500 text-white text-xs font-bold rounded-full animate-pulse">
                                {tab.badge > 99 ? '99+' : tab.badge}
                            </span>
                        )}

                        {/* Active Indicator for underline variant */}
                        {variant === 'underline' && activeTab === index && (
                            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-600 animate-scaleIn" />
                        )}
                    </button>
                ))}
            </div>

            {/* Tab Content */}
            <div className="mt-6">
                {tabs.map((tab, index) => (
                    <div
                        key={index}
                        id={`tab-panel-${index}`}
                        role="tabpanel"
                        aria-labelledby={`tab-${index}`}
                        hidden={activeTab !== index}
                        className={activeTab === index ? 'animate-fadeIn' : ''}
                    >
                        {tab.content}
                    </div>
                ))}
            </div>
        </div>
    );
}
