// Netlify function for main endpoint
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

  // Check if API token is configured
  const API_TOKEN = process.env.API_TOKEN || process.env.AGENTAI_API_TOKEN;

  try {
    const response = {
      status: API_TOKEN ? 'authenticated' : 'no-auth',
      service: 'Agent.AI MCP Server (Netlify)',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      authentication: API_TOKEN ? 'configured' : 'missing',
      platform: 'Netlify Functions',
      endpoints: {
        main: '/',
        api: '/api/mcp'
      }
    };

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(response, null, 2)
    };

  } catch (error) {
    console.error('Function error:', error);
    
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