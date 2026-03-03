import PageHero from '@/components/PageHero';
import { Bell } from 'lucide-react';
import UpdatesClient from './UpdatesClient';

export default function UpdatesPage() {
  return (
    <main className="flex flex-col min-h-screen font-cairo bg-slate-50 dark:bg-slate-950">
      <PageHero
        title="آخر التحديثات"
        description="كل ما يُضاف للموقع من مقالات وسيناريوهات وأخبار — تلقائياً."
        icon={<Bell className="w-10 h-10 md:w-12 md:h-12 text-accent-500" />}
        titleClassName="md:text-5xl"
      />

      <UpdatesClient />
    </main>
  );
}
