import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import EDevletServicesHub from '@/components/EDevletServicesHub';
import { EDEVLET_ARTICLES } from '@/lib/articles/edevlet';

export const dynamic = 'force-static';

export default function EDevletServicesPage() {
  const services = Object.entries(EDEVLET_ARTICLES)
    .map(([id, article]) => ({ id, article }))
    .sort((a, b) => a.article.title.localeCompare(b.article.title, 'ar'));

  return (
    <main className="min-h-screen flex flex-col">
      <Navbar />

      <EDevletServicesHub
        services={services.map(({ id, article }) => ({
          id,
          title: article.title,
          intro: article.intro,
          lastUpdate: article.lastUpdate,
          source: article.source ?? undefined,
        }))}
      />

      <Footer />
    </main>
  );
}
