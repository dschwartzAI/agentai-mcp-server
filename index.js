// Agent.AI MCP Server proxy for Vercel deployment
const http = require('http');
const { spawn } = require('child_process');
const { URL } = require('url');

// Check if API token is configured
const API_TOKEN = process.env.API_TOKEN || process.env.AGENTAI_API_TOKEN;

if (!API_TOKEN) {
  console.warn('WARNING: No API_TOKEN configured. MCP server may not authenticate properly.');
}

// Create HTTP server that proxies to Agent.AI MCP server
const server = http.createServer(async (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  try {
    // Handle health check
    if (req.url === '/' || req.url === '/health') {
      const response = {
        status: API_TOKEN ? 'authenticated' : 'no-auth',
        service: 'Agent.AI MCP Server Proxy',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        authentication: API_TOKEN ? 'configured' : 'missing'
      };
      
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(response));
      return;
    }

    // For MCP requests, try to proxy to the actual Agent.AI MCP server
    if (API_TOKEN && req.url.startsWith('/mcp')) {
      // Spawn the actual MCP server process
      const mcpProcess = spawn('npx', ['@agentai/mcp-server'], {
        env: {
          ...process.env,
          API_TOKEN: API_TOKEN
        },
        stdio: ['pipe', 'pipe', 'pipe']
      });

      // Collect request body
      let body = '';
      req.on('data', chunk => {
        body += chunk.toString();
      });

      req.on('end', () => {
        // Send request to MCP server
        if (body) {
          mcpProcess.stdin.write(body);
        }
        mcpProcess.stdin.end();
      });

      // Collect response from MCP server
      let mcpResponse = '';
      mcpProcess.stdout.on('data', (data) => {
        mcpResponse += data.toString();
      });

      mcpProcess.on('close', (code) => {
        if (code === 0 && mcpResponse) {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(mcpResponse);
        } else {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ 
            error: 'MCP Server Error',
            code: code,
            message: 'Failed to communicate with Agent.AI MCP server'
          }));
        }
      });

      mcpProcess.on('error', (error) => {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ 
          error: 'MCP Server Spawn Error',
          message: error.message 
        }));
      });

    } else {
      // Return configuration info for other requests
      const response = {
        service: 'Agent.AI MCP Server Proxy',
        status: 'ready',
        endpoints: {
          health: '/',
          mcp: '/mcp'
        },
        authentication: API_TOKEN ? 'configured' : 'required',
        message: API_TOKEN ? 'Ready to proxy MCP requests' : 'API_TOKEN environment variable required'
      };
      
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(response));
    }
    
  } catch (error) {
    console.error('Server error:', error);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ 
      error: 'Internal Server Error',
      message: error.message 
    }));
  }
});

// Export for Vercel serverless functions
module.exports = server;

// For local development
if (require.main === module) {
  const port = process.env.PORT || 3000;
  server.listen(port, () => {
    console.log(`Agent.AI MCP Server running on port ${port}`);
    console.log(`API Token: ${API_TOKEN ? 'configured' : 'missing'}`);
  });
} 