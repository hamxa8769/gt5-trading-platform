const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 8080;

const mimeTypes = {
    '.html': 'text/html',
    '.js': 'text/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpg',
    '.svg': 'image/svg+xml',
};

const server = http.createServer((req, res) => {
    let filePath = req.url === '/' ? '/public/index.html' : req.url;
    
    // Handle SPA routing
    if (!filePath.includes('.') && filePath !== '/') {
        filePath = '/public/index.html';
    }

    filePath = path.join(__dirname, filePath);

    fs.readFile(filePath, (err, content) => {
        if (err) {
            if (err.code === 'ENOENT') {
                res.writeHead(404, { 'Content-Type': 'text/html' });
                res.end('<h1>404 Not Found</h1>', 'utf-8');
            } else {
                res.writeHead(500);
                res.end('Server Error: ' + err.code);
            }
        } else {
            const extname = path.extname(filePath);
            const contentType = mimeTypes[extname] || 'application/octet-stream';

            res.writeHead(200, { 
                'Content-Type': contentType,
                'Access-Control-Allow-Origin': '*'
            });
            res.end(content, 'utf-8');
        }
    });
});

server.listen(PORT, () => {
    console.log(`Frontend server running at http://localhost:${PORT}/`);
});
