const fs = require('node:fs');
const path = require('node:path');

const distDir = path.join(__dirname, '..', 'dist');
const viewportContent = 'width=device-width, initial-scale=1, viewport-fit=cover';
const mobileViewportCss = `
<style id="pulse-mobile-viewport-fix">
  html,
  body,
  #root {
    min-height: 100%;
    min-height: 100dvh;
    overflow-x: hidden;
  }

  body {
    margin: 0;
    padding-bottom: env(safe-area-inset-bottom);
    -webkit-text-size-adjust: 100%;
  }
</style>`;

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
  const viewportTagPattern = /<meta(?:\s+data-rh="true")?\s+name="viewport"\s+content="[^"]*"\s*\/?>/g;
  let hasWrittenViewport = false;
  let nextHtml = html.replace(viewportTagPattern, () => {
    if (hasWrittenViewport) {
      return '';
    }
    hasWrittenViewport = true;
    return `<meta name="viewport" content="${viewportContent}"/>`;
  });

  if (!nextHtml.includes('id="pulse-mobile-viewport-fix"')) {
    nextHtml = nextHtml.replace('</head>', `${mobileViewportCss}\n</head>`);
  }

  fs.writeFileSync(file, nextHtml);
}
