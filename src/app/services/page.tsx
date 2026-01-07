'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { Search, MapPin, Phone, Briefcase, Star, ImageIcon, X, Mail, ExternalLink, SlidersHorizontal } from 'lucide-react';
import { MOCK_PROVIDERS, SERVICE_CATEGORIES } from '@/lib/services-data';
import RatingModal from '@/components/rating/RatingModal';
import Footer from '@/components/Footer';
import PageHeader from '@/components/ui/PageHeader';
import EmptyState from '@/components/EmptyState';

// Note: Metadata cannot be exported from client components
// SEO is handled by the parent layout or server component

export default function ServicesPage() {
  // --- State ---
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [ratingModal, setRatingModal] = useState<{ isOpen: boolean, id: any, name: string }>({ isOpen: false, id: null, name: '' });

  // --- Filtering Logic ---
  const filteredServices = useMemo(() => {
    return MOCK_PROVIDERS.filter(service => {
      const matchesCategory = activeCategory === 'all' || service.category === activeCategory;
      const matchesSearch =
        service.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        service.profession.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (service.description && service.description.toLowerCase().includes(searchQuery.toLowerCase()));

      return matchesCategory && matchesSearch;
    });
  }, [activeCategory, searchQuery]);

  // --- WhatsApp Helper ---
  const buildWhatsAppHref = (phone: string, text: string) => {
    if (!phone) return '';
    const cleanPhone = phone.replace(/\D/g, '');
    return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`;
  };

  return (
    <div className="min-h-screen bg-transparent font-cairo" dir="rtl">

      {/* Hero / Search Section - Dark Theme as requested */}
      <section className="relative bg-slate-900 border-b border-slate-800 py-16 px-4 overflow-hidden rounded-b-[80px]">
        {/* Background Pattern for Hero */}
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "url('https://www.transparenttextures.com/patterns/cubes.png')" }} />

        <div className="relative z-10 max-w-3xl mx-auto text-center space-y-6">
          <h1 className="text-3xl md:text-5xl font-extrabold leading-tight text-white">
            ابحث عن <span className="text-emerald-500">مهنتك</span> أو <span className="text-blue-500">خدمتك</span>
          </h1>
          <p className="text-slate-300 text-lg">
            دليل الخدمات الشامل: أطباء، محامون، حرفيون، وخدمات عامة في تركيا.
          </p>

          <div className="relative max-w-2xl mx-auto group">
            {/* Search Input */}
            <input
              type="text"
              placeholder="جرب البحث عن: نجار في الفاتح، مترجم محلف، طبيب أسنان..."
              className="w-full bg-slate-800/80 backdrop-blur-md border border-slate-700 rounded-2xl py-4 pe-4 ps-12 text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all text-lg shadow-xl"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={20} />
          </div>

          {/* Service Categories (Filters) */}
          <div className="flex flex-wrap items-center justify-center gap-2 mt-6">
            <button
              onClick={() => setActiveCategory('all')}
              className={`px-4 py-2 rounded-full font-bold text-sm transition-all ${activeCategory === 'all'
                ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/25'
                : 'bg-slate-800/50 backdrop-blur-sm text-slate-300 hover:bg-slate-800 border border-slate-700'}`}
            >
              الكل
            </button>
            {SERVICE_CATEGORIES.filter(c => c.id !== 'all').map((cat) => {
              const isActive = activeCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`px-4 py-2 rounded-full font-bold text-sm transition-all flex items-center gap-2 ${isActive
                    ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/25'
                    : 'bg-slate-800/50 backdrop-blur-sm text-slate-300 hover:bg-slate-800 border border-slate-200 dark:border-slate-700'}`}
                >
                  {cat.icon && <cat.icon size={16} />}
                  {cat.name}
                </button>
              )
            })}
          </div>
        </div>
      </section>

      {/* Results Grid - Netlify Style with Stars and Contact Buttons */}
      <section className="max-w-screen-2xl mx-auto px-4 py-12 w-full flex-grow">

        <div className="flex items-center justify-end mb-6">
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <Briefcase className="text-emerald-500" />
            نتائج البحث ({filteredServices.length})
          </h2>
        </div>

        {filteredServices.length === 0 ? (
          <div className="text-center py-20 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm rounded-3xl border border-slate-200 dark:border-slate-800 border-dashed">
            <Search size={48} className="mx-auto text-slate-300 mb-4" />
            <h3 className="text-lg font-bold text-slate-600 dark:text-slate-400">لا توجد نتائج مطابقة</h3>
            <p className="text-slate-500 text-sm">حاول تغيير كلمات البحث أو الفئة المختارة</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredServices.map((provider) => (
              <div
                key={provider.id}
                className="group bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden hover:shadow-xl hover:border-emerald-400 transition-all duration-300 flex flex-col"
              >
                {/* Header */}
                <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0 overflow-hidden">
                      {provider.image ? <img src={provider.image} className="w-full h-full object-cover" /> : <Briefcase size={24} className="text-slate-400" />}
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base leading-tight group-hover:text-emerald-600 transition-colors">
                        {provider.name}
                      </h3>
                      <p className="text-xs font-bold text-emerald-600 mt-1">{provider.profession}</p>
                    </div>
                  </div>

                  {/* Rating - USER REQUESTED THIS */}
                  <div className="flex flex-col items-end gap-1">
                    <div className="flex items-center gap-1 bg-amber-50 dark:bg-amber-900/30 px-2 py-1 rounded-lg border border-amber-100 dark:border-amber-800">
                      <Star size={12} className="fill-amber-400 text-amber-400" />
                      <span className="text-xs font-bold text-amber-900 dark:text-amber-100">{provider.rating}</span>
                    </div>
                    <span className="text-[10px] text-slate-400">({provider.reviewCount})</span>
                    <button
                      onClick={() => setRatingModal({ isOpen: true, id: provider.id, name: provider.name })}
                      className="text-[10px] font-bold text-emerald-600 hover:text-emerald-700 hover:underline cursor-pointer"
                    >
                      قيم الآن
                    </button>
                  </div>
                </div>

                {/* Body */}
                <div className="p-5 flex-grow">
                  <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 mb-3">
                    <MapPin size={14} />
                    <span>{provider.city} {provider.district && `، ${provider.district}`}</span>
                  </div>
                  <p className="text-sm text-slate-600 dark:text-slate-300 line-clamp-3 leading-relaxed">
                    {provider.description}
                  </p>
                </div>

                {/* Footer Buttons - STRONG CARDS */}
                <div className="p-4 bg-slate-50 dark:bg-slate-900/50 mt-auto flex gap-2 h-[72px] items-center">
                  {provider.image && (
                    <button
                      onClick={() => setPreviewImage(provider.image!)}
                      className="w-14 flex flex-col items-center justify-center gap-1 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 py-1.5 rounded-xl font-bold text-[10px] hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors shrink-0 h-full"
                      title="عرض كرت الفيزيت"
                    >
                      <ImageIcon size={18} />
                      <span>الكرت</span>
                    </button>
                  )}

                  {(() => {
                    const href = buildWhatsAppHref(provider.phone, `مرحباً، رأيت خدمتك "${provider.profession}" على موقع دليل العرب.`);
                    return (
                      <a
                        href={href || '#'}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white py-2.5 rounded-xl font-bold transition-all shadow-lg shadow-emerald-500/20 active:scale-95 text-sm h-full"
                      >
                        <Phone size={18} />
                        <span>تواصل واتساب</span>
                      </a>
                    );
                  })()}
                </div>

              </div>
            ))}
          </div>
        )}
      </section>

      {/* Image Modal */}
      {previewImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 backdrop-blur-sm animate-in fade-in"
          onClick={() => setPreviewImage(null)}
        >
          <button
            onClick={() => setPreviewImage(null)}
            className="absolute top-4 right-4 text-white hover:text-red-400 transition-colors"
          >
            <X size={32} />
          </button>
          <img
            src={previewImage}
            alt="Business Card"
            className="max-w-full max-h-[90vh] rounded-xl shadow-2xl animate-in zoom-in-95"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}

      <RatingModal
        isOpen={ratingModal.isOpen}
        onClose={() => setRatingModal({ ...ratingModal, isOpen: false })}
        serviceId={ratingModal.id}
        serviceName={ratingModal.name}
      />

      <Footer />
    </div>
  );
}
