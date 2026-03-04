'use client';

import dynamic from 'next/dynamic';

export const GuidedJourney = dynamic(() => import('@/components/GuidedJourney'), {
  loading: () => <div className="h-96 animate-pulse bg-slate-100 dark:bg-slate-900 rounded-xl mx-4" />,
});

export const QuickActionsGrid = dynamic(() => import('@/components/home/QuickActionsGrid'), {
  loading: () => <div className="h-64 animate-pulse bg-slate-100 dark:bg-slate-900 rounded-xl mx-4" />,
});

export const HomeFAQ = dynamic(() => import('@/components/home/HomeFAQ'), {
  loading: () => <div className="h-48 animate-pulse bg-slate-100 dark:bg-slate-900 rounded-xl mx-4" />,
});
