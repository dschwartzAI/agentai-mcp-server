// Netlify function for MCP API endpoint
const { spawn } = require('child_process');

exports.handler = async (event, context) => {
  // Set CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Content-Type': 'application/json'
  };

  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  const API_TOKEN = process.env.API_TOKEN || process.env.AGENTAI_API_TOKEN;

  try {
    // Handle GET requests - return server status
    if (event.httpMethod === 'GET') {
      const response = {
        service: 'Agent.AI MCP Server API (Netlify)',
        version: '1.0.0',
        status: 'running',
        authentication: API_TOKEN ? 'configured' : 'missing',
        timestamp: new Date().toISOString(),
        platform: 'Netlify Functions',
        message: API_TOKEN ? 'Ready to process MCP requests' : 'API_TOKEN required for MCP functionality'
      };

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(response, null, 2)
      };
    }

    // Handle POST requests - proxy to actual MCP server
    if (event.httpMethod === 'POST' && API_TOKEN) {
      return new Promise((resolve, reject) => {
        // Spawn the actual Agent.AI MCP server
        const mcpProcess = spawn('npx', ['@agentai/mcp-server'], {
          env: {
            ...process.env,
            API_TOKEN: API_TOKEN
          },
          stdio: ['pipe', 'pipe', 'pipe']
        });

        // Send request body to MCP server
        if (event.body) {
          mcpProcess.stdin.write(event.body);
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
              resolve({
                statusCode: 200,
                headers,
                body: JSON.stringify(parsedResponse)
              });
            } catch (parseError) {
              resolve({
                statusCode: 200,
                headers: { ...headers, 'Content-Type': 'text/plain' },
                body: mcpResponse
              });
            }
          } else {
            resolve({
              statusCode: 500,
              headers,
              body: JSON.stringify({ 
                error: 'MCP Server Error',
                code: code,
                stderr: mcpError,
                message: 'Failed to communicate with Agent.AI MCP server'
              })
            });
          }
        });

        mcpProcess.on('error', (error) => {
          resolve({
            statusCode: 500,
            headers,
            body: JSON.stringify({ 
              error: 'MCP Server Spawn Error',
              message: error.message 
            })
          });
        });

        // Timeout after 25 seconds (Netlify function timeout is 26 seconds)
        setTimeout(() => {
          mcpProcess.kill();
          resolve({
            statusCode: 408,
            headers,
            body: JSON.stringify({
              error: 'Request Timeout',
              message: 'MCP server request timed out'
            })
          });
        }, 25000);
      });

    } else if (!API_TOKEN) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({
          error: 'Authentication Required',
          message: 'API_TOKEN environment variable is required for MCP functionality',
          hint: 'Set API_TOKEN in Netlify environment variables'
        })
      };
    } else {
      return {
        statusCode: 405,
        headers,
        body: JSON.stringify({
          error: 'Method Not Allowed',
          message: 'Only GET and POST methods are supported'
        })
      };
    }

  } catch (error) {
    console.error('API error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Internal Server Error',
        message: error.message 
      })
    };
  }
}; 