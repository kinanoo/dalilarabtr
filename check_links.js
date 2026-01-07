
import { ARTICLES } from './src/lib/articles';
import { CONSULTANT_SCENARIOS } from './src/lib/consultant-data';

const articleKeys = new Set(Object.keys(ARTICLES));
const brokenLinks = [];

Object.entries(CONSULTANT_SCENARIOS).forEach(([id, scenario]) => {
    if (scenario.link && scenario.link.startsWith('/article/')) {
        const articleId = scenario.link.replace('/article/', '');
        if (!articleKeys.has(articleId)) {
            brokenLinks.push({ id, link: scenario.link, field: 'link' });
        }
    }
    if (scenario.sources) {
        scenario.sources.forEach(source => {
            if (source.url && source.url.startsWith('/article/')) {
                const articleId = source.url.replace('/article/', '');
                if (!articleKeys.has(articleId)) {
                    brokenLinks.push({ id, url: source.url, field: 'source' });
                }
            }
        });
    }
});

console.log('Broken Links found:', JSON.stringify(brokenLinks, null, 2));
