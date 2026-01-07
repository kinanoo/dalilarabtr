const fs = require('fs');

const OLD_KEY = 42;
const NEW_KEY = 7;

function recoverSafe(text) {
    if (!text) return text;
    // 1. Try New Base64-ASCII (nested)
    try {
        const d1 = Buffer.from(text, 'base64').toString('utf8');
        const unshifted = d1.split('').map(c => String.fromCharCode(c.charCodeAt(0) - NEW_KEY)).join('');
        const d2 = Buffer.from(unshifted, 'base64').toString('utf8');
        if (/[\u0600-\u06FF]/.test(d2)) return d2;
    } catch (e) { }

    // 2. Try Old Char Shift
    try {
        const unshifted = text.split('').map(char => String.fromCharCode(char.charCodeAt(0) - OLD_KEY)).join('');
        const decoded = Buffer.from(unshifted, 'base64').toString('utf8');
        if (/[\u0600-\u06FF]/.test(decoded)) return decoded;
    } catch (e) { }

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

    // Convert all backtick strings to something we can process
    // This is hard with regex, so we'll just search for the keys and replace their values

    const fields = ['details', 'fees', 'warning'];
    fields.forEach(field => {
        const regex = new RegExp(`(${field}:\\s*)(\`|'|")([\\s\\S]*?)\\2`, 'g');
        content = content.replace(regex, (match, prefix, q, val) => {
            const recovered = recoverSafe(val);
            if (/[\u0600-\u06FF]/.test(recovered)) {
                return `${prefix}${JSON.stringify(obfuscateSafe(recovered))}`;
            }
            return match;
        });
    });

    const arrayFields = ['documents', 'steps', 'tips'];
    arrayFields.forEach(field => {
        const regex = new RegExp(`(${field}:\\s*\\[)([\\s\\S]*?)(\\])`, 'g');
        content = content.replace(regex, (match, prefix, values, suffix) => {
            const newValues = values.replace(/(\`|'|")([\\s\\S]*?)\1/g, (m, q, v) => {
                const recovered = recoverSafe(v);
                if (/[\u0600-\u06FF]/.test(recovered)) {
                    return JSON.stringify(obfuscateSafe(recovered));
                }
                return m;
            });
            return `${prefix}${newValues}${suffix}`;
        });
    });

    fs.writeFileSync(filePath, content);
}

processFile('c:/Users/Dopara/Downloads/daleel-arab-turkiye/src/lib/articles.ts');
processFile('c:/Users/Dopara/Downloads/daleel-arab-turkiye/src/lib/articles/edevlet.ts');
