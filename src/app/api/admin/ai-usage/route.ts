import { createClient } from '@supabase/supabase-js';
import { NextResponse, type NextRequest } from 'next/server';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';

async function verifyAdmin(request: NextRequest) {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll() } }
  );
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const serviceClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  const { data: profile } = await serviceClient
    .from('member_profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'admin') return null;
  return serviceClient;
}

// GET: Fetch AI usage stats
export async function GET(request: NextRequest) {
  const serviceClient = await verifyAdmin(request);
  if (!serviceClient) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Total count
    const { count: totalQueries } = await serviceClient
      .from('ai_usage_logs')
      .select('*', { count: 'exact', head: true });

    // Today's count
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const { count: todayQueries } = await serviceClient
      .from('ai_usage_logs')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', today.toISOString());

    // This week count
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const { count: weekQueries } = await serviceClient
      .from('ai_usage_logs')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', weekAgo.toISOString());

    // Provider breakdown
    const { data: providerStats } = await serviceClient
      .from('ai_usage_logs')
      .select('provider');

    const providerCounts: Record<string, number> = {};
    for (const row of providerStats || []) {
      providerCounts[row.provider] = (providerCounts[row.provider] || 0) + 1;
    }

    // Recent queries (last 50)
    const { data: recentQueries } = await serviceClient
      .from('ai_usage_logs')
      .select('id, query, provider, model, success, created_at')
      .order('created_at', { ascending: false })
      .limit(50);

    // Most common topics (extract keywords from queries)
    const { data: allQueries } = await serviceClient
      .from('ai_usage_logs')
      .select('query')
      .order('created_at', { ascending: false })
      .limit(500);

    const topicCounts: Record<string, number> = {};
    const topicKeywords = [
      { keyword: 'إحصائيات', label: 'إحصائيات الموقع' },
      { keyword: 'مقال', label: 'المقالات' },
      { keyword: 'تعليق', label: 'التعليقات' },
      { keyword: 'خبر', label: 'الأخبار' },
      { keyword: 'إشعار', label: 'الإشعارات' },
      { keyword: 'حذف', label: 'عمليات الحذف' },
      { keyword: 'إضاف', label: 'عمليات الإضافة' },
      { keyword: 'تعديل', label: 'عمليات التعديل' },
      { keyword: 'زيار', label: 'الزيارات' },
      { keyword: 'سجل', label: 'سجل النشاط' },
      { keyword: 'بانر', label: 'البانر' },
      { keyword: 'خدم', label: 'الخدمات' },
      { keyword: 'كود', label: 'الأكواد' },
      { keyword: 'منطق', label: 'المناطق' },
      { keyword: 'إعداد', label: 'الإعدادات' },
    ];

    for (const row of allQueries || []) {
      for (const t of topicKeywords) {
        if (row.query?.includes(t.keyword)) {
          topicCounts[t.label] = (topicCounts[t.label] || 0) + 1;
        }
      }
    }

    const topTopics = Object.entries(topicCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([topic, count]) => ({ topic, count }));

    // Success rate
    const successCount = (recentQueries || []).filter(q => q.success).length;
    const totalRecent = (recentQueries || []).length;
    const successRate = totalRecent > 0 ? Math.round((successCount / totalRecent) * 100) : 100;

    return NextResponse.json({
      stats: {
        totalQueries: totalQueries || 0,
        todayQueries: todayQueries || 0,
        weekQueries: weekQueries || 0,
        successRate,
        providerCounts,
        topTopics,
      },
      recentQueries: recentQueries || [],
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
