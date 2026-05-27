// Servidor HTTP simples para servir arquivos estáticos do frontend
// Usa a variável PORT do Railway automaticamente
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;

const MIME = {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css',
    '.js': 'application/javascript',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
    '.webp': 'image/webp',
    '.woff': 'font/woff',
    '.woff2': 'font/woff2',
    '.ttf': 'font/ttf',
    '.mp4': 'video/mp4',
    '.webm': 'video/webm',
};

const server = http.createServer((req, res) => {
    let urlPath = req.url.split('?')[0];

    // Root → index.html
    if (urlPath === '/') urlPath = '/index.html';

    const filePath = path.join(__dirname, urlPath);

    fs.readFile(filePath, (err, data) => {
        if (err) {
            // Tenta index.html como fallback (SPA)
            const indexPath = path.join(__dirname, 'index.html');
            fs.readFile(indexPath, (err2, indexData) => {
                if (err2) {
                    res.writeHead(404); res.end('Not Found');
                } else {
                    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
                    res.end(indexData);
                }
            });
            return;
        }

        const ext = path.extname(filePath).toLowerCase();
        const contentType = MIME[ext] || 'application/octet-stream';
        res.writeHead(200, { 'Content-Type': contentType });
        res.end(data);
    });
});

server.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Frontend QSESMI rodando na porta ${PORT}`);
});
