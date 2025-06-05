const { createServer } = require('@agentai/mcp-server');

// Create and export the MCP server
const server = createServer();

// Export for Vercel serverless functions
module.exports = server;

// For local development
if (require.main === module) {
  const port = process.env.PORT || 3000;
  server.listen(port, () => {
    console.log(`Agent.AI MCP Server running on port ${port}`);
  });
} 