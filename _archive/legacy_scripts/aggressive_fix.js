const fs = require('fs');
const path = require('path');

const OLD_KEY = 42;
const NEW_KEY = 7;

function recover(encoded) {
    if (!encoded) return null;
    try {
        const unshifted = encoded.split('').map(char => {
            return String.fromCharCode(char.charCodeAt(0) - OLD_KEY);
        }).join('');

        // Check if it's base64
        const decoded = Buffer.from(unshifted, 'base64').toString('utf8');
        // If it contains Arabic characters, it's likely our lost data
        if (/[\u0600-\u06FF]/.test(decoded)) {
            return decoded;
        }
        return null;
    } catch (e) {
        return null;
    }
}

function obfuscateSafe(text) {
    if (!text) return '';
    const b1 = Buffer.from(text).toString('base64');
    const shifted = b1.split('').map(c => String.fromCharCode(c.charCodeAt(0) + NEW_KEY)).join('');
    return Buffer.from(shifted).toString('base64');
}

function processFile(filePath) {
    console.log(`Aggressive Processing: ${filePath}`);
    let content = fs.readFileSync(filePath, 'utf8');

    // Find ALL string literals
    content = content.replace(/(['"\`])([\s\S]*?)\1/g, (match, quote, value) => {
        // Try to recover
        const recovered = recover(value);
        if (recovered) {
            console.log(`  Recovered string starting with: ${recovered.substring(0, 20)}...`);
            return `${quote}${obfuscateSafe(recovered)}${quote}`;
        }
        return match;
    });

    fs.writeFileSync(filePath, content);
    console.log(`Finished: ${filePath}`);
}

const files = [
    'c:/Users/Dopara/Downloads/daleel-arab-turkiye/src/lib/articles.ts',
    'c:/Users/Dopara/Downloads/daleel-arab-turkiye/src/lib/articles/edevlet.ts'
];

files.forEach(f => {
    if (fs.existsSync(f)) processFile(f);
});
