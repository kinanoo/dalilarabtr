const fs = require('fs');

function purgeGarbage(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');

    // We'll process article by article
    const articles = content.split(/\s*['"]?([a-z0-9-]+)['"]?:\s*\{/);
    let newContent = 'import { Article } from "./types";\n\nexport const articles: Record<string, Article> = {\n';

    // articles[0] is the header
    for (let i = 1; i < articles.length; i += 2) {
        const id = articles[i];
        const body = articles[i + 1];
        if (!body) continue;

        newContent += `  '${id}': {\n`;

        // Extract properties
        const props = ['title', 'category', 'lastUpdate', 'intro', 'details', 'warning', 'fees', 'source'];
        props.forEach(p => {
            const regex = new RegExp(`${p}:\\s*(".*?"|'.*?'|\`.*?\`)`, 's');
            const match = body.match(regex);
            if (match) {
                // Ensure double quotes and clean any internal backslash issues
                let val = match[1];
                if (val.startsWith('`') || val.startsWith("'")) {
                    val = `"${val.slice(1, -1).replace(/"/g, '\\"')}"`;
                }
                newContent += `    ${p}: ${val},\n`;
            }
        });

        // Extract arrays
        const arrays = ['documents', 'steps', 'tips', 'seoKeywords'];
        arrays.forEach(a => {
            const regex = new RegExp(`${a}:\\s*\\[([\\s\\S]*?)\\]`, 's');
            const match = body.match(regex);
            if (match) {
                const items = match[1].match(/(".*?"|'.*?'|`.*?`)/g);
                if (items) {
                    const cleanedItems = items.map(it => {
                        let v = it;
                        if (v.startsWith('`') || v.startsWith("'")) {
                            v = `"${v.slice(1, -1).replace(/"/g, '\\"')}"`;
                        }
                        return v;
                    });
                    newContent += `    ${a}: [${cleanedItems.join(', ')}],\n`;
                }
            }
        });

        newContent += '  },\n\n';
    }

    newContent += '};\n';
    fs.writeFileSync(filePath, newContent);
    console.log(`Purged garbage from: ${filePath}`);
}

purgeGarbage('c:/Users/Dopara/Downloads/daleel-arab-turkiye/src/lib/articles.ts');
purgeGarbage('c:/Users/Dopara/Downloads/daleel-arab-turkiye/src/lib/articles/edevlet.ts');
