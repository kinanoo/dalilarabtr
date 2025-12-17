import FAQClient from '@/components/FAQClient';
import { getFAQData } from '@/lib/faq';

export default function FAQPage() {
  const data = getFAQData();
  const totalCount = data.reduce((sum, cat) => sum + cat.questions.length, 0);

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: data
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
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <FAQClient data={data} totalCount={totalCount} />
    </>
  );
}