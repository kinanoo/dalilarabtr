import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

// Usage:
//   node scripts/import-closed-areas-from-html.mjs path/to/zones.html public/data/closed-areas.json
//
// The script extracts the `const officialData = [...]` array from the provided HTML/JS,
// evaluates it in a sandbox, and writes a JSON file with the shape:
//   { updatedAt: "2025", source: "Kapalı Mahalleler Listesi", items: [...] }

const [,, inputPath, outputPath = 'public/data/closed-areas.json'] = process.argv;

if (!inputPath) {
  console.error('Missing inputPath. Example: node scripts/import-closed-areas-from-html.mjs zones.html public/data/closed-areas.json');
  process.exit(1);
}

const absInput = path.resolve(process.cwd(), inputPath);
const absOutput = path.resolve(process.cwd(), outputPath);

const html = fs.readFileSync(absInput, 'utf8');

// Grab the array literal after `const officialData =`.
const match = html.match(/const\s+officialData\s*=\s*(\[[\s\S]*?\])\s*;?/m);
if (!match) {
  console.error('Could not find `const officialData = [...]` in input HTML.');
  process.exit(1);
}

const arrayLiteral = match[1];

// Evaluate in a minimal sandbox.
const sandbox = {};
const context = vm.createContext(sandbox);

let items;
try {
  // Wrap in parentheses so object literals parse correctly.
  items = vm.runInContext(`(${arrayLiteral})`, context, { timeout: 1000 });
} catch (error) {
  console.error('Failed to evaluate officialData array.');
  console.error(error);
  process.exit(1);
}

if (!Array.isArray(items)) {
  console.error('Parsed data is not an array.');
  process.exit(1);
}

const payload = {
  updatedAt: '2025',
  source: 'Kapalı Mahalleler Listesi',
  items,
};

fs.mkdirSync(path.dirname(absOutput), { recursive: true });
fs.writeFileSync(absOutput, JSON.stringify(payload, null, 2) + '\n', 'utf8');

console.log(`Wrote ${items.length} items -> ${outputPath}`);
