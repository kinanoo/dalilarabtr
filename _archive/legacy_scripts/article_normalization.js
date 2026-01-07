const fs = require('fs');

const OLD_KEY = 42;
const NEW_KEY = 7;

function recoverSafe(text) {
    if (!text) return text;
    // Strip everything that isn't Base64 or ASCII
    let cleaned = text.replace(/[^A-Za-z0-9+/=]/g, '');

    // Try Old Char Shift recovery (+42)
    try {
        const unshifted = text.split('').map(char => String.fromCharCode(char.charCodeAt(0) - OLD_KEY)).join('');
        const decoded = Buffer.from(unshifted, 'base64').toString('utf8');
        if (/[\u0600-\u06FF]/.test(decoded)) return decoded;
    } catch (e) { }

    // Try New Base64-ASCII recovery (+7)
    try {
        // Find Base64 strings in the text
        const b64Matches = text.match(/[A-Za-z0-9+/=]{16,}/g);
        if (b64Matches) {
            for (let b64 of b64Matches) {
                try {
                    const d1 = Buffer.from(b64, 'base64').toString('utf8');
                    const unshifted = d1.split('').map(c => String.fromCharCode(c.charCodeAt(0) - NEW_KEY)).join('');
                    const d2 = Buffer.from(unshifted, 'base64').toString('utf8');
                    if (/[\u0600-\u06FF]/.test(d2)) return d2;
                } catch (e) { }
            }
        }
    } catch (e) { }

    // If it's already Arabic, return it
    if (/[\u0600-\u06FF]/.test(text)) return text;

    return text;
}

function obfuscateSafe(text) {
    if (!text) return '';
    const b1 = Buffer.from(text).toString('base64');
    const shifted = b1.split('').map(c => String.fromCharCode(c.charCodeAt(0) + NEW_KEY)).join('');
    return Buffer.from(shifted).toString('base64');
}

function processFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');

    const FIELDS = ['details', 'fees', 'warning'];
    FIELDS.forEach(field => {
        // Regex to find property and everything until comma or closing brace
        const regex = new RegExp(`(${field}:\\s*)([\\s\\S]*?)(?=\\s*[,\\}])`, 'g');
        content = content.replace(regex, (match, prefix, val) => {
            const recovered = recoverSafe(val);
            if (/[\u0600-\u06FF]/.test(recovered)) {
                return `${prefix}${JSON.stringify(obfuscateSafe(recovered))}`;
            }
            return match;
        });
    });

    const ARRAY_FIELDS = ['documents', 'steps', 'tips'];
    ARRAY_FIELDS.forEach(field => {
        const regex = new RegExp(`(${field}:\\s*\\[)([\\s\\S]*?)(\\])`, 'g');
        content = content.replace(regex, (match, prefix, val, suffix) => {
            // Find all potential strings in the array
            const items = val.split(',').map(item => {
                const recovered = recoverSafe(item);
                if (/[\u0600-\u06FF]/.test(recovered)) {
                    return ` ${JSON.stringify(obfuscateSafe(recovered))}`;
                }
                return item;
            });
            return `${prefix}${items.join(',')}${suffix}`;
        });
    });

    // Final global cleanup for stray \u followed by space
    content = content.replace(/\\u\s+/g, '');

    fs.writeFileSync(filePath, content);
}

processFile('c:/Users/Dopara/Downloads/daleel-arab-turkiye/src/lib/articles.ts');
processFile('c:/Users/Dopara/Downloads/daleel-arab-turkiye/src/lib/articles/edevlet.ts');
