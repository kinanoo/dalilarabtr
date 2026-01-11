import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
    const baseUrl = (process.env.NEXT_PUBLIC_SITE_URL || 'https://dalilarab.vercel.app').replace(/\/$/, '');

    return {
        rules: {
            userAgent: '*',
            allow: '/',
            disallow: ['/admin/', '/private/', '/api/'],
        },
        sitemap: `${baseUrl}/sitemap.xml`,
    };
}
