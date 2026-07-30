const fs = require('node:fs');
const path = require('node:path');

const distDir = path.join(__dirname, '..', 'dist');
const viewportContent = 'width=device-width, initial-scale=1, viewport-fit=cover';

function walk(dir, files = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(fullPath, files);
    } else if (entry.isFile() && entry.name.endsWith('.html')) {
      files.push(fullPath);
    }
  }
  return files;
}

fs.writeFileSync(path.join(distDir, '.nojekyll'), '');

for (const file of walk(distDir)) {
  const html = fs.readFileSync(file, 'utf8');
  const nextHtml = html.replace(
    /<meta\s+name="viewport"\s+content="[^"]*"\s*\/?>/g,
    `<meta name="viewport" content="${viewportContent}"/>`
  );
  fs.writeFileSync(file, nextHtml);
}
