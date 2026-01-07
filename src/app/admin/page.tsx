'use client';

import {
  LayoutDashboard,
  FileText,
  Briefcase,
  ShieldAlert,
  Users,
  Activity,
  PlusCircle,
  BrainCircuit,
  Database,
  Zap,
  MapPin
} from 'lucide-react';
import Link from 'next/link';

const StatCard = ({ title, value, icon: Icon, color, subtext }: any) => (
  <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4 hover:shadow-md transition-all group">
    <div className={`p-4 rounded-xl bg-${color}-100 dark:bg-${color}-900/30 text-${color}-600 dark:text-${color}-400 group-hover:scale-110 transition-transform`}>
      <Icon size={28} />
    </div>
    <div>
      <p className="text-sm font-bold text-slate-500 uppercase tracking-wider">{title}</p>
      <h3 className="text-3xl font-black text-slate-800 dark:text-white mt-1">{value}</h3>
      {subtext && <p className="text-xs font-bold text-slate-400 mt-1">{subtext}</p>}
    </div>
  </div>
);

const QuickActionBtn = ({ title, icon: Icon, color, href }: any) => (
  <Link
    href={href}
    className={`flex flex-col items-center justify-center p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-${color}-500 hover:bg-${color}-50 dark:hover:bg-${color}-950/20 transition-all group shadow-sm hover:shadow-xl hover:-translate-y-1`}
  >
    <div className={`p-4 rounded-full bg-${color}-100 dark:bg-${color}-900/30 text-${color}-600 dark:text-${color}-400 mb-3 group-hover:scale-110 transition-transform`}>
      <Icon size={32} />
    </div>
    <span className="font-bold text-slate-700 dark:text-slate-200 group-hover:text-slate-900 dark:group-hover:text-white">{title}</span>
  </Link>
);

export default function AdminDashboard() {
  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">لوحة المعلومات</h1>
          <p className="text-slate-500 font-medium mt-1">نظرة عامة على أداء النظام والمحتوى</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-emerald-100 text-emerald-700 rounded-full font-bold text-sm animate-pulse">
          <Activity size={18} />
          <span>النظام يعمل بكفاءة 100%</span>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="المقالات النشطة"
          value="188"
          icon={FileText}
          color="emerald"
          subtext="+12 هذا الأسبوع"
        />
        <StatCard
          title="السيناريوهات"
          value="90"
          icon={BrainCircuit}
          color="violet"
          subtext="الذكاء الاصطناعي"
        />
        <StatCard
          title="مناطق محظورة"
          value="1,163"
          icon={MapPin}
          color="red"
          subtext="محدثة تلقائياً"
        />
        <StatCard
          title="أكواد أمنية"
          value="116"
          icon={ShieldAlert}
          color="amber"
          subtext="V-Codes / G-Codes"
        />
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
          <Zap className="text-yellow-500" />
          إجراءات سريعة
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <QuickActionBtn href="/admin/articles/new" title="مقال جديد" icon={PlusCircle} color="emerald" />
          <QuickActionBtn href="/admin/zones/new" title="إضافة منطقة" icon={MapPin} color="red" />
          <QuickActionBtn href="/admin/codes/new" title="كود جديد" icon={ShieldAlert} color="amber" />
          <QuickActionBtn href="/admin/scenarios/new" title="سيناريو جديد" icon={BrainCircuit} color="violet" />
        </div>
      </div>

      {/* System Visualizer (Placeholder for "Status System Widget") */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-slate-900 rounded-3xl p-6 relative overflow-hidden text-white">
          <div className="absolute top-0 left-0 w-full h-full bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none"></div>
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-xl font-bold">حالة قاعدة البيانات</h3>
              <Database className="text-emerald-400" />
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-slate-400 font-mono">Articles Table</span>
                <div className="h-2 flex-1 mx-4 bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 w-[75%] rounded-full"></div>
                </div>
                <span className="font-bold text-emerald-400">Normal</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400 font-mono">Zones DB</span>
                <div className="h-2 flex-1 mx-4 bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500 w-[90%] rounded-full"></div>
                </div>
                <span className="font-bold text-blue-400">Optimized</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400 font-mono">API Health</span>
                <div className="h-2 flex-1 mx-4 bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-purple-500 w-[98%] rounded-full"></div>
                </div>
                <span className="font-bold text-purple-400">98ms</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-center items-center text-center">
          <div className="w-20 h-20 rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-600 flex items-center justify-center mb-4">
            <Users size={40} />
          </div>
          <h3 className="text-xl font-bold text-slate-800 dark:text-white">المستخدمين النشطين</h3>
          <p className="text-4xl font-black text-slate-900 dark:text-white mt-2">1,204</p>
          <p className="text-sm font-bold text-green-500 mt-1">↑ 12% نمو شهري</p>
        </div>
      </div>
    </div>
  );
}
