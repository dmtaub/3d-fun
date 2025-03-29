const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

// Create HTTP server to handle requests
const server = http.createServer((req, res) => {
  // Parse the URL
  const parsedUrl = url.parse(req.url);
  let pathname = parsedUrl.pathname;
  
  // Remove the '/legacy' prefix to get the file path in the 'old' directory
  // If accessing root, redirect to /legacy
  if (pathname === '/') {
    res.writeHead(302, { 'Location': '/legacy' });
    res.end();
    return;
  }
  
  // For all other paths, serve from old directory
  let filePath;
  if (pathname.startsWith('/legacy')) {
    filePath = path.join(__dirname, pathname.substring(7));
  } else {
    filePath = path.join(__dirname, pathname);
  }
  
  // Check if the file exists
  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      // If the path doesn't specify a file, try to serve index.html
      if (pathname.endsWith('/') || !pathname.includes('.')) {
        const indexPath = path.join(filePath, 'index.html');
        fs.stat(indexPath, (err, stats) => {
          if (err || !stats.isFile()) {
            res.writeHead(404);
            res.end('File not found');
            return;
          }
          serveFile(indexPath, res);
        });
        return;
      }
      
      // File not found
      res.writeHead(404);
      res.end('File not found');
      return;
    }
    
    // Serve the file
    serveFile(filePath, res);
  });
});

// Helper function to serve a file
function serveFile(filePath, res) {
  const fileStream = fs.createReadStream(filePath);
  
  // Set content type based on file extension
  const ext = path.extname(filePath).toLowerCase();
  const contentTypes = {
    '.html': 'text/html',
    '.js': 'text/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.gif': 'image/gif',
  };
  
  res.writeHead(200, { 'Content-Type': contentTypes[ext] || 'text/plain' });
  fileStream.pipe(res);
  
  fileStream.on('error', () => {
    res.writeHead(500);
    res.end('Server error');
  });
}

// Start the server
server.listen(1234, () => {
  console.log('Server running at http://localhost:1234');
  console.log('Legacy files are served from the legacy directory');
}); 