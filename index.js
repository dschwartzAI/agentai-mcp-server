// Simple HTTP server that proxies to the AgentAI MCP server
const http = require('http');
const { spawn } = require('child_process');

// Create a simple HTTP server
const server = http.createServer((req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  // Health check endpoint
  if (req.url === '/health' || req.url === '/') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ 
      status: 'ok', 
      service: 'Agent.AI MCP Server',
      timestamp: new Date().toISOString()
    }));
    return;
  }

  // For MCP requests, return info about the server
  if (req.url.startsWith('/mcp') || req.method === 'POST') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      service: 'Agent.AI MCP Server',
      version: '0.1.1',
      endpoint: req.url,
      method: req.method,
      message: 'MCP Server is running',
      timestamp: new Date().toISOString()
    }));
    return;
  }

  // Default response
  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Not found' }));
});

// Export for Vercel serverless functions
module.exports = server;

// For local development
if (require.main === module) {
  const port = process.env.PORT || 3000;
  server.listen(port, () => {
    console.log(`Agent.AI MCP Server running on port ${port} - Deployed ${new Date().toISOString()}`);
  });
} 