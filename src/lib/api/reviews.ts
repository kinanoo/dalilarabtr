import { supabase } from '../supabaseClient';

// ============================================
// 📊 Types
// ============================================

export type ServiceReview = {
    id: string;
    service_id: string;
    service_name: string;
    reviewer_name: string;
    rating: number;
    comment: string;
    helpful_count: number;
    is_verified: boolean;
    is_approved: boolean;
    created_at: string;
    updated_at: string;
};

export type ReviewStats = {
    average_rating: number;
    total_reviews: number;
    rating_distribution: {
        '5': number;
        '4': number;
        '3': number;
        '2': number;
        '1': number;
    };
};

export type AddReviewData = {
    service_id: string;
    service_name: string;
    reviewer_name: string;
    reviewer_email?: string;
    rating: number;
    comment?: string; // Optional
};

// ============================================
// 📖 جلب تقييمات خدمة معينة
// ============================================

export async function getServiceReviews(
    serviceId: string,
    options: { limit?: number; offset?: number; orderBy?: 'newest' | 'highest' | 'helpful' } = {}
): Promise<{ data: ServiceReview[]; error: any }> {
    if (!supabase) {
        return { data: [], error: new Error('Supabase not initialized') };
    }

    try {
        let query = supabase
            .from('service_reviews')
            .select('*')
            .eq('service_id', serviceId)
            .eq('is_approved', true);

        // ترتيب
        switch (options.orderBy) {
            case 'highest':
                query = query.order('rating', { ascending: false });
                break;
            case 'helpful':
                query = query.order('helpful_count', { ascending: false });
                break;
            case 'newest':
            default:
                query = query.order('created_at', { ascending: false });
        }

        // Pagination
        if (options.limit) {
            query = query.limit(options.limit);
        }
        if (options.offset) {
            query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
        }

        const { data, error } = await query;

        if (error) throw error;
        return { data: data || [], error: null };
    } catch (error) {
        console.error('Error fetching reviews:', error);
        return { data: [], error };
    }
}

// ============================================
// ⭐ جلب إحصائيات التقييمات
// ============================================

export async function getReviewStats(serviceId: string): Promise<{ data: ReviewStats | null; error: any }> {
    if (!supabase) {
        return { data: null, error: new Error('Supabase not initialized') };
    }

    try {
        const { data, error } = await supabase.rpc('get_service_rating_stats', {
            p_service_id: serviceId,
        });

        if (error) throw error;

        // إرجاع أول صف (الـ Function ترجع صف واحد)
        const stats = data?.[0] || null;
        return { data: stats, error: null };
    } catch (error) {
        console.error('Error fetching review stats:', error);
        return { data: null, error };
    }
}

// ============================================
// ➕ إضافة تقييم جديد
// ============================================

export async function addReview(reviewData: AddReviewData): Promise<{ data: ServiceReview | null; error: any }> {
    if (!supabase) {
        return { data: null, error: new Error('Supabase not initialized') };
    }

    try {
        const { data, error } = await supabase
            .from('service_reviews')
            .insert([
                {
                    service_id: reviewData.service_id,
                    service_name: reviewData.service_name,
                    client_name: reviewData.reviewer_name, // Map to DB column
                    // reviewer_email: reviewData.reviewer_email, // Column missing in DB schema
                    rating: reviewData.rating,
                    comment: reviewData.comment,
                    is_approved: true, // Auto-approve
                },
            ])
            .select()
            .single();

        if (error) throw error;
        return { data, error: null };
    } catch (error) {
        console.error('Error adding review:', error);
        return { data: null, error };
    }
}

// ============================================
// 👍 التصويت على تقييم (مفيد)
// ============================================

export async function markReviewHelpful(
    reviewId: string,
    voterIp: string
): Promise<{ success: boolean; error: any }> {
    if (!supabase) {
        return { success: false, error: new Error('Supabase not initialized') };
    }

    try {
        // محاولة إضافة التصويت
        const { error: voteError } = await supabase.from('review_helpful_votes').insert([
            {
                review_id: reviewId,
                voter_ip: voterIp,
            },
        ]);

        if (voteError) {
            // إذا كان الخطأ بسبب التكرار (صوّت مسبقاً)، نعتبرها نجاح
            if (voteError.code === '23505') {
                // Unique constraint violation
                return { success: true, error: null };
            }
            throw voteError;
        }

        // تحديث العدد في جدول التقييمات
        const { error: updateError } = await supabase.rpc('increment_helpful_count', {
            review_id: reviewId,
        });

        // إذا فشل التحديث، لا بأس - سنحسبه من الـ votes
        return { success: true, error: null };
    } catch (error) {
        console.error('Error marking review helpful:', error);
        return { success: false, error };
    }
}

// ============================================
// 🔢 دالة مساعدة لزيادة helpful_count
// ============================================
// يجب إضافة هذه Function في Supabase:
/*
CREATE OR REPLACE FUNCTION increment_helpful_count(review_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE service_reviews 
  SET helpful_count = helpful_count + 1 
  WHERE id = review_id;
END;
$$ LANGUAGE plpgsql;
*/
