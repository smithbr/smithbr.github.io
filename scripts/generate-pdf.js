const { chromium } = require('playwright');
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3456;
const ROOT = path.join(__dirname, '..');

function serve() {
  const mimeTypes = {
    '.html': 'text/html',
    '.css': 'text/css',
    '.otf': 'font/otf',
    '.ttf': 'font/ttf',
    '.woff': 'font/woff',
    '.woff2': 'font/woff2',
  };

  const server = http.createServer((req, res) => {
    const filePath = path.join(ROOT, req.url === '/' ? 'resume.html' : req.url);
    fs.readFile(filePath, (err, data) => {
      if (err) {
        res.writeHead(404);
        res.end('Not found');
        return;
      }
      const ext = path.extname(filePath);
      res.writeHead(200, { 'Content-Type': mimeTypes[ext] || 'application/octet-stream' });
      res.end(data);
    });
  });

  return new Promise(resolve => server.listen(PORT, () => resolve(server)));
}

async function generate() {
  const server = await serve();
  const browser = await chromium.launch();

  try {
    const page = await browser.newPage();
    await page.emulateMedia({ colorScheme: 'light' });
    await page.goto(`http://localhost:${PORT}/resume.html`, { waitUntil: 'networkidle' });

    const outputPath = path.join(ROOT, 'assets', 'BrandonSmith_Resume.pdf');
    await page.pdf({
      path: outputPath,
      format: 'Letter',
      margin: { top: '0.5in', right: '0.5in', bottom: '0.5in', left: '0.5in' },
      printBackground: true,
    });

    console.log(`PDF generated: ${outputPath}`);
  } finally {
    await browser.close();
    server.close();
  }
}

generate().catch(err => {
  console.error(err);
  process.exit(1);
});
