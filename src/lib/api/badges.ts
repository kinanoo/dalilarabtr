import { supabase } from '@/lib/supabaseClient';

export type BadgeType = 'newcomer' | 'active' | 'voice' | 'reviewer' | 'expert_reviewer' | 'corrector' | 'top_contributor';

export interface Badge {
    type: BadgeType;
    label: string;
    icon: string;
    color: string;
}

const BADGE_DEFINITIONS: Record<BadgeType, Badge> = {
    newcomer: { type: 'newcomer', label: 'مشارك جديد', icon: '💬', color: 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400' },
    active: { type: 'active', label: 'مساهم نشط', icon: '🗣️', color: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400' },
    voice: { type: 'voice', label: 'صوت المجتمع', icon: '📢', color: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400' },
    reviewer: { type: 'reviewer', label: 'مُقيّم', icon: '⭐', color: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400' },
    expert_reviewer: { type: 'expert_reviewer', label: 'مُقيّم متمرس', icon: '🌟', color: 'bg-amber-200 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300' },
    corrector: { type: 'corrector', label: 'مُصحح', icon: '✅', color: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400' },
    top_contributor: { type: 'top_contributor', label: 'مساهم مميز', icon: '🏆', color: 'bg-gradient-to-r from-amber-100 to-yellow-100 dark:from-amber-900/30 dark:to-yellow-900/30 text-amber-800 dark:text-amber-300' },
};

export function computeBadges(stats: { comments: number; reviews: number; corrections: number }): Badge[] {
    const badges: Badge[] = [];

    // Comment-based badges (highest first)
    if (stats.comments >= 10 && stats.reviews >= 3) {
        badges.push(BADGE_DEFINITIONS.top_contributor);
    } else if (stats.comments >= 10) {
        badges.push(BADGE_DEFINITIONS.voice);
    } else if (stats.comments >= 5) {
        badges.push(BADGE_DEFINITIONS.active);
    } else if (stats.comments >= 1) {
        badges.push(BADGE_DEFINITIONS.newcomer);
    }

    // Review-based badges
    if (stats.reviews >= 5) {
        badges.push(BADGE_DEFINITIONS.expert_reviewer);
    } else if (stats.reviews >= 1) {
        badges.push(BADGE_DEFINITIONS.reviewer);
    }

    // Correction badge
    if (stats.corrections >= 1) {
        badges.push(BADGE_DEFINITIONS.corrector);
    }

    return badges;
}

// Get the primary (highest) badge for display next to username
export function getPrimaryBadge(stats: { comments: number; reviews: number; corrections: number }): Badge | null {
    const badges = computeBadges(stats);
    return badges[0] || null;
}

// Fetch user stats for badge computation
export async function fetchUserBadgeStats(userId: string): Promise<{ comments: number; reviews: number; corrections: number }> {
    if (!supabase || !userId) return { comments: 0, reviews: 0, corrections: 0 };

    const [commentsRes, reviewsRes, correctionsRes] = await Promise.all([
        supabase.from('comments').select('id', { count: 'exact', head: true }).eq('user_id', userId).eq('status', 'approved'),
        supabase.from('service_reviews').select('id', { count: 'exact', head: true }).eq('user_id', userId),
        supabase.from('comments').select('id', { count: 'exact', head: true }).eq('user_id', userId).eq('is_correction', true).eq('status', 'approved'),
    ]);

    return {
        comments: commentsRes.count || 0,
        reviews: reviewsRes.count || 0,
        corrections: correctionsRes.count || 0,
    };
}

export { BADGE_DEFINITIONS };
