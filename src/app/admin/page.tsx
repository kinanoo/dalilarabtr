'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { LayoutDashboard, Users, FileText, Globe, Bell, Shield, Lock, Settings, MessageSquare } from 'lucide-react';

// Components
import DashboardHome from '@/components/admin/DashboardHome';
import ServicesManager from '@/components/admin/ServicesManager';
import ArticleManager from '@/components/admin/ArticleManager';
import CodesManager from '@/components/admin/CodesManager';
import ZonesManager from '@/components/admin/ZonesManager';
import { UpdatesManager, FAQManager } from '@/components/admin/ContentParsers';
import { SourcesManager } from '@/components/admin/SourcesManager';
import ConfigManager from '@/components/admin/ConfigManager';
import SuggestionsManager from '@/components/admin/SuggestionsManager';

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState('home');
  const [stats, setStats] = useState({ services: 0, articles: 0, updates: 0 });

  useEffect(() => {
    async function fetchStats() {
      if (!supabase) return;
      const { count: sCount } = await supabase.from('service_providers').select('*', { count: 'exact', head: true });
      const { count: aCount } = await supabase.from('articles').select('*', { count: 'exact', head: true });
      const { count: uCount } = await supabase.from('updates').select('*', { count: 'exact', head: true });
      setStats({
        services: sCount || 0,
        articles: aCount || 0,
        updates: uCount || 0
      });
    }
    fetchStats();
  }, []);

  const tabs = [
    { id: 'home', label: 'الرئيسية', icon: LayoutDashboard },
    { id: 'suggestions', label: 'الاقتراحات', icon: MessageSquare },
    { id: 'services', label: 'الخدمات', icon: Users },
    { id: 'articles', label: 'المقالات', icon: FileText },
    { id: 'updates', label: 'أخبار & FAQ', icon: Bell },
    { id: 'codes', label: 'كودات أمنية', icon: Shield },
    { id: 'zones', label: 'مناطق محظورة', icon: Lock },
    { id: 'sources', label: 'روابط رسمية', icon: Globe },
    { id: 'config', label: 'الإعدادات', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-cairo" dir="rtl">

      {/* Top Bar */}
      <header className="bg-slate-900 text-white p-4 shadow-lg sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <LayoutDashboard className="text-emerald-400" />
            <h1 className="text-xl font-bold">لوحة تحكم المدير</h1>
          </div>
          <div className="flex gap-4 text-sm font-bold text-slate-400">
            <span>{stats.services} خدمة</span>
            <span className="w-px h-5 bg-slate-700"></span>
            <span>{stats.articles} مقال</span>
            <span className="w-px h-5 bg-slate-700"></span>
            <span>{stats.updates} تحديث</span>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-4 md:p-8">

        {/* Tabs */}
        <div className="flex overflow-x-auto gap-2 pb-4 mb-6 border-b border-slate-200 dark:border-slate-800 scrollbar-hide">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-5 py-3 rounded-xl font-bold whitespace-nowrap transition-all ${activeTab === tab.id
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
            >
              <tab.icon size={18} />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content Area */}
        {activeTab === 'home' && <DashboardHome onNavigate={setActiveTab} />}
        {activeTab === 'suggestions' && <SuggestionsManager />}
        {activeTab === 'services' && <ServicesManager />}
        {activeTab === 'articles' && <ArticleManager />}
        {activeTab === 'codes' && <CodesManager />}
        {activeTab === 'zones' && <ZonesManager />}

        {activeTab === 'updates' && (
          <div className="space-y-8">
            <UpdatesManager />
            <hr className="border-slate-200 dark:border-slate-800" />
            <FAQManager />
          </div>
        )}

        {activeTab === 'sources' && <SourcesManager />}

        {activeTab === 'config' && <ConfigManager />}

      </main>
    </div>
  );
}
