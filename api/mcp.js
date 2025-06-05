module.exports = async (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    // MCP Server Response
    const response = {
      service: 'Agent.AI MCP Server',
      version: '0.1.1',
      status: 'running',
      method: req.method,
      url: req.url,
      timestamp: new Date().toISOString(),
      message: 'MCP Server is operational'
    };

    res.status(200).json(response);
  } catch (error) {
    res.status(500).json({ 
      error: 'Internal Server Error',
      message: error.message 
    });
  }
}; 