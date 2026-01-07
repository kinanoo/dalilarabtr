
import { getUnifiedSearchIndex } from '../src/lib/searchIndex';
import { normalizeArabic } from '../src/lib/arabicSearch';

console.log('--- Starting Debug ---');
const index = getUnifiedSearchIndex();
console.log(`Total Index Size: ${index.length}`);

const consultantItems = index.filter(i => i.typeKey === 'consultant');
console.log(`Consultant Items: ${consultantItems.length}`);

if (consultantItems.length > 0) {
    console.log('Sample Consultant Item:', consultantItems[0].title);
    console.log('Sample Haystack:', consultantItems[0].haystack);
} else {
    console.error('ERROR: No consultant items found in index!');
}

const kimlikQuery = 'كملك';
const kimlikNorm = normalizeArabic(kimlikQuery);
console.log(`Query Normalized: ${kimlikNorm}`);

const match = consultantItems.find(i => i.haystack.includes(kimlikNorm));
if (match) {
    console.log(`FOUND MATCH: ${match.title}`);
} else {
    console.log('NO MATCH FOUND for kimlik in consultant items.');
}
console.log('--- End Debug ---');
