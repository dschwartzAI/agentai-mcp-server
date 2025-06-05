const { spawn } = require('child_process');

module.exports = async (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const API_TOKEN = process.env.API_TOKEN || process.env.AGENTAI_API_TOKEN;

  try {
    // Handle GET requests - return server status
    if (req.method === 'GET') {
      const response = {
        service: 'Agent.AI MCP Server API',
        version: '1.0.0',
        status: 'running',
        authentication: API_TOKEN ? 'configured' : 'missing',
        timestamp: new Date().toISOString(),
        message: API_TOKEN ? 'Ready to process MCP requests' : 'API_TOKEN required for MCP functionality'
      };

      res.status(200).json(response);
      return;
    }

    // Handle POST requests - proxy to actual MCP server
    if (req.method === 'POST' && API_TOKEN) {
      // Spawn the actual Agent.AI MCP server
      const mcpProcess = spawn('npx', ['@agentai/mcp-server'], {
        env: {
          ...process.env,
          API_TOKEN: API_TOKEN
        },
        stdio: ['pipe', 'pipe', 'pipe']
      });

      // Send request body to MCP server
      if (req.body) {
        mcpProcess.stdin.write(JSON.stringify(req.body));
      }
      mcpProcess.stdin.end();

      // Collect response from MCP server
      let mcpResponse = '';
      let mcpError = '';

      mcpProcess.stdout.on('data', (data) => {
        mcpResponse += data.toString();
      });

      mcpProcess.stderr.on('data', (data) => {
        mcpError += data.toString();
      });

      mcpProcess.on('close', (code) => {
        if (code === 0 && mcpResponse) {
          try {
            const parsedResponse = JSON.parse(mcpResponse);
            res.status(200).json(parsedResponse);
          } catch (parseError) {
            res.status(200).send(mcpResponse);
          }
        } else {
          res.status(500).json({ 
            error: 'MCP Server Error',
            code: code,
            stderr: mcpError,
            message: 'Failed to communicate with Agent.AI MCP server'
          });
        }
      });

      mcpProcess.on('error', (error) => {
        res.status(500).json({ 
          error: 'MCP Server Spawn Error',
          message: error.message 
        });
      });

    } else if (!API_TOKEN) {
      res.status(401).json({
        error: 'Authentication Required',
        message: 'API_TOKEN environment variable is required for MCP functionality',
        hint: 'Set API_TOKEN in Vercel environment variables'
      });
    } else {
      res.status(405).json({
        error: 'Method Not Allowed',
        message: 'Only GET and POST methods are supported'
      });
    }

  } catch (error) {
    console.error('API error:', error);
    res.status(500).json({ 
      error: 'Internal Server Error',
      message: error.message 
    });
  }
}; 