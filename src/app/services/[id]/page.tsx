import { supabase } from '@/lib/supabaseClient';
import { notFound } from 'next/navigation';
import ServiceProfileHeader from '@/components/services/ServiceProfileHeader';
import ServiceReviews from '@/components/services/ServiceReviews';
import { Phone, AlertTriangle } from 'lucide-react';
import UniversalComments from '@/components/community/UniversalComments';
import ContentHelpfulWidget from '@/components/community/ContentHelpfulWidget';

export const revalidate = 3600; // ISR: Revalidate every hour
export const dynamicParams = true;

export async function generateStaticParams() {
    if (!supabase) return [];
    const { data: services } = await supabase.from('service_providers').select('id');
    return (services || []).map((service) => ({
        id: service.id,
    }));
}

export default async function ServiceProfilePage({ params }: { params: Promise<{ id: string }> }) {
    // 1. Fetch Service Data
    if (!supabase) return <div>Database configuration error</div>;

    const { id } = await params; // Await params for Next.js 15+

    const { data: service, error } = await supabase
        .from('service_providers')
        .select('*')
        .eq('id', id)
        .single();

    if (error) {
        console.error('SERVER ERROR fetching service:', error);
        console.error('Requested ID:', id);
    }

    if (!service) {
        console.error('Service data is null for ID:', id);
    }

    if (error || !service) {
        notFound();
    }

    // Prepare Contact Number (Phone acts as WhatsApp)
    const securePhone = service.phone || service.whatsapp;
    const whatsappLink = securePhone
        ? `https://wa.me/${securePhone.replace(/\D/g, '')}?text=${encodeURIComponent(`مرحباً ${service.name}، تواصلت معك عن طريق موقع دليل العرب.`)}`
        : '#';

    return (
        <main className="min-h-screen bg-slate-50 dark:bg-slate-900 pb-20">
            {/* Header Component */}
            <ServiceProfileHeader service={service} />

            <div className="container mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* Main Content (Right Column) */}
                <div className="lg:col-span-2 space-y-8">

                    {/* Bio & Description */}
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
                        <h2 className="text-xl font-bold mb-4 text-slate-800 dark:text-slate-100 border-b border-slate-100 dark:border-slate-700 pb-2">
                            تعريف بالخدمة
                        </h2>
                        <div className="prose dark:prose-invert max-w-none text-slate-600 dark:text-slate-300 leading-relaxed">
                            {service.bio ? (
                                <p className="whitespace-pre-line">{service.bio}</p>
                            ) : (
                                <p className="whitespace-pre-line">{service.description || 'لا يوجد وصف متاح.'}</p>
                            )}
                        </div>
                    </div>
                </div>

                <ContentHelpfulWidget entityType="service" entityId={service.id} />

                {/* Service QA / Discussion */}
                <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
                    <UniversalComments entityType="service" entityId={service.id} title="أسئلة ومناقشات" />
                </div>

                {/* Reviews System */}
                <ServiceReviews serviceId={service.id} serviceName={service.name} />
            </div>

            {/* Sidebar (Left Column) */}
            <div className="space-y-6">

                {/* Sticky Contact Card */}
                <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 sticky top-24">
                    <h3 className="font-bold text-lg mb-4 text-center">تواصل مع مقدم الخدمة</h3>

                    {securePhone ? (
                        <a
                            href={whatsappLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block w-full bg-[#25D366] hover:bg-[#20bd5a] text-white text-center py-4 rounded-xl font-bold mb-4 shadow-lg shadow-green-500/20 transition-transform active:scale-95 flex items-center justify-center gap-2"
                        >
                            <Phone size={20} />
                            <span>تواصل عبر واتساب</span>
                        </a>
                    ) : (
                        <div className="bg-slate-100 text-slate-500 text-center py-4 rounded-xl font-bold mb-4">
                            الرقم غير متوفر
                        </div>
                    )}

                    <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800 p-4 rounded-xl text-xs text-amber-800 dark:text-amber-200 leading-relaxed flex items-start gap-2">
                        <AlertTriangle size={16} className="shrink-0 mt-0.5" />
                        <p>
                            <strong>إخلاء مسؤولية:</strong> موقع دليل العرب هو منصة وسيطة للإعلان فقط. لسنا مسؤولين عن جودة الخدمة أو الاتفاقات المالية. يرجى توخي الحذر والاتفاق بوضوح قبل الدفع.
                        </p>
                    </div>
                </div>
            </div>
        </div>
            </div >
        </main >
    );
}
