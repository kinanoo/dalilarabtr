const fs = require('fs');

const OLD_KEY = 42;
const NEW_KEY = 7;

function recoverSafe(text) {
    if (!text) return text;
    // 1. Try New Base64-ASCII
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

    // First, remove the literal garbage sequences that break the syntax
    // e.g. `Base64`garbage`Arabic`
    content = content.replace(/(`)([\s\S]*?)(\1)/g, (match, q, val) => {
        // Try to recover parts of the val
        // If val contains `, it means we have a breakage.
        // But our regex is non-greedy, so it matches `...`

        // Clean the internal value from literal garbage characters that shouldn't be in Base64 or recovered text
        let cleaned = val.replace(/[\u0100-\uFFFF]/g, char => {
            const dec = String.fromCharCode(char.charCodeAt(0) - OLD_KEY);
            return dec;
        });

        // Now try to extract the base64 parts from the cleaned string
        // Base64 regex: [A-Za-z0-9+/=]{4,}
        cleaned = cleaned.replace(/[A-Za-z0-9+/=]{16,}/g, b64 => {
            const r = recoverSafe(b64);
            if (r !== b64) return r;
            return b64;
        });

        // If after all this we have Arabic, we obfuscate it again
        if (/[\u0600-\u06FF]/.test(cleaned)) {
            return `\`${obfuscateSafe(cleaned)}\``;
        }

        return `${q}${val}${q}`;
    });

    // Final scrub for lines like line 1157 which might have had text OUTSIDE strings
    const lines = content.split('\n');
    const fixedLines = lines.map(line => {
        if (line.includes('•') && !line.includes('`') && !line.includes("'") && !line.includes('"')) {
            // This line has a bullet point but is not in a string. It's likely corruption.
            // We'll wrap it in a string if it looks like it belongs to 'details'
            return `  // RESTORED: \`${line.trim()}\``;
        }
        return line;
    });

    fs.writeFileSync(filePath, fixedLines.join('\n'));
}

processFile('c:/Users/Dopara/Downloads/daleel-arab-turkiye/src/lib/articles.ts');
processFile('c:/Users/Dopara/Downloads/daleel-arab-turkiye/src/lib/articles/edevlet.ts');
