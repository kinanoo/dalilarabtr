import { supabase } from '@/lib/supabaseClient';

export type BadgeType = 'newcomer' | 'active' | 'voice' | 'reviewer' | 'expert_reviewer' | 'corrector' | 'top_contributor';

export interface Badge {
    type: BadgeType;
    label: string;
    icon: string;
    color: string;
}

/**
 * Rank reads from WEIGHT, not from hue. These chips used to run
 * slate→blue→purple→amber→amber→emerald→amber-gradient, which put six colours
 * under one comment thread and still left the reader guessing which badge
 * outranked which. Every tier now shares the quiet chip; the two top tiers
 * invert to ink so seniority is legible at a glance — and stays legible to a
 * reader who cannot separate blue from purple.
 */
const CHIP = 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300';
const CHIP_TOP = 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900';

const BADGE_DEFINITIONS: Record<BadgeType, Badge> = {
    newcomer: { type: 'newcomer', label: 'مشارك جديد', icon: '💬', color: CHIP },
    active: { type: 'active', label: 'مساهم نشط', icon: '🗣️', color: CHIP },
    voice: { type: 'voice', label: 'صوت المجتمع', icon: '📢', color: CHIP },
    reviewer: { type: 'reviewer', label: 'مُقيّم', icon: '⭐', color: CHIP },
    expert_reviewer: { type: 'expert_reviewer', label: 'مُقيّم متمرس', icon: '🌟', color: CHIP_TOP },
    corrector: { type: 'corrector', label: 'مُصحح', icon: '✅', color: CHIP },
    top_contributor: { type: 'top_contributor', label: 'مساهم مميز', icon: '🏆', color: CHIP_TOP },
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
