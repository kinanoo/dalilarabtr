const fs = require('fs');

const OLD_KEY = 42;
const NEW_KEY = 7;

function recoverNew(encoded) {
    if (!encoded) return null;
    try {
        const decoded1 = Buffer.from(encoded, 'base64').toString('utf8');
        const unshifted = decoded1.split('').map(c => String.fromCharCode(c.charCodeAt(0) - NEW_KEY)).join('');
        const decoded2 = Buffer.from(unshifted, 'base64').toString('utf8');
        if (/[\u0600-\u06FF]/.test(decoded2)) return decoded2;
    } catch (e) { }
    return null;
}

function recoverOld(encoded) {
    if (!encoded) return null;
    try {
        const unshifted = encoded.split('').map(char => String.fromCharCode(char.charCodeAt(0) - OLD_KEY)).join('');
        const decoded = Buffer.from(unshifted, 'base64').toString('utf8');
        if (/[\u0600-\u06FF]/.test(decoded)) return decoded;
    } catch (e) { }
    return null;
}

function processFile(filePath) {
    console.log(`Universal Recovery: ${filePath}`);
    let content = fs.readFileSync(filePath, 'utf8');

    content = content.replace(/(['"\`])([\s\S]*?)\1/g, (match, quote, value) => {
        // Try New, then Old
        const rNew = recoverNew(value);
        if (rNew) return `${quote}${rNew}${quote}`;

        const rOld = recoverOld(value);
        if (rOld) return `${quote}${rOld}${quote}`;

        return match;
    });

    // Specifically fix the corruption around line 1064
    // Pattern: `Base64`sx“_...`
    // We'll just try to find multi-backtick strings and keep only the recovered part
    content = content.replace(/(`)([\s\S]*?)(`)([\s\S]*?)(`)/g, (match, q1, v1, q2, v2, q3) => {
        const r1 = recoverNew(v1) || recoverOld(v1);
        const r2 = recoverNew(v2) || recoverOld(v2);
        if (r1) return `\`${r1}\``;
        if (r2) return `\`${r2}\``;
        return match;
    });

    fs.writeFileSync(filePath, content);
    console.log(`Finished Recovery: ${filePath}`);
}

const files = [
    'c:/Users/Dopara/Downloads/daleel-arab-turkiye/src/lib/articles.ts',
    'c:/Users/Dopara/Downloads/daleel-arab-turkiye/src/lib/articles/edevlet.ts'
];

files.forEach(f => {
    if (fs.existsSync(f)) processFile(f);
});
