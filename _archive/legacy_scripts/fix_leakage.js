const fs = require('fs');

function fixLeakage(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');

    // Pattern 1: `...`garbage`...` -> `[obfuscated merge]`
    // We'll replace the middle part with a single backtick join or just remove the garbage
    content = content.replace(/(`[\s\S]*?`)([\s\S]*?)(`[\s\S]*?`)/g, (match, s1, mid, s2) => {
        // If mid contains only garbage and no property keys, it's a leak
        if (!mid.includes(':') && mid.trim().length > 0) {
            console.log(`Found leakage between backticks: ${mid.substring(0, 20)}...`);
            return `\`${s1.slice(1, -1)}${mid}${s2.slice(1, -1)}\``;
        }
        return match;
    });

    // Pattern 2: property: `...`garbage
    // If a line starts with a property and has a backtick but later has garbage without quote
    const lines = content.split('\n');
    const fixedLines = lines.map(line => {
        const propMatch = line.match(/^\s*(details|fees|warning|documents|steps|tips):\s*(`.*`)(.*)$/);
        if (propMatch) {
            const [full, prop, str, garbage] = propMatch;
            if (garbage.trim().length > 0 && !garbage.includes(':')) {
                return `    ${prop}: ${str.slice(0, -1)}${garbage}\``;
            }
        }
        return line;
    });

    fs.writeFileSync(filePath, fixedLines.join('\n'));
    console.log(`Fixed leakage in: ${filePath}`);
}

fixLeakage('c:/Users/Dopara/Downloads/daleel-arab-turkiye/src/lib/articles.ts');
fixLeakage('c:/Users/Dopara/Downloads/daleel-arab-turkiye/src/lib/articles/edevlet.ts');
