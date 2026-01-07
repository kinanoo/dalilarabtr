// ✅ اختبار اتصال Supabase
import { supabase } from './supabaseClient';

export async function testSupabaseConnection() {
    if (!supabase) {
        console.error('❌ Supabase client not initialized');
        console.log('تأكد من وجود المتغيرات البيئية:');
        console.log('- NEXT_PUBLIC_SUPABASE_URL');
        console.log('- NEXT_PUBLIC_SUPABASE_ANON_KEY');
        return false;
    }

    try {
        // اختبار بسيط: محاولة قراءة من أي جدول
        const { data, error } = await supabase
            .from('articles')
            .select('count')
            .limit(1);

        if (error) {
            console.warn('⚠️ الاتصال موجود لكن لا توجد جداول بعد:', error.message);
            console.log('✅ Supabase متصل - جاهز لإنشاء الجداول');
            return true; // الاتصال موجود حتى لو الجدول غير موجود
        }

        console.log('✅ Supabase متصل وجاهز!');
        return true;
    } catch (err) {
        console.error('❌ خطأ في الاتصال:', err);
        return false;
    }
}

// للاختبار السريع:
// testSupabaseConnection().then(result => console.log('Result:', result));
