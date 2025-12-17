import FAQClientNew from '@/components/FAQClientNew';
import { getFAQData } from '@/lib/faq';

export default function FAQPage() {
  // قراءة البيانات الثابتة على السيرفر (600+ سؤال)
  const staticData = getFAQData();
  const totalCount = staticData.reduce((sum, cat) => sum + cat.questions.length, 0);

  // Schema.org للـ SEO
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: staticData
      .flatMap(cat => cat.questions)
      .slice(0, 200)
      .map(q => ({
        '@type': 'Question',
        name: q.q,
        acceptedAnswer: {
          '@type': 'Answer',
          text: q.a
        }
      }))
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <FAQClientNew staticData={staticData} totalCount={totalCount} />
    </>
  );
}
