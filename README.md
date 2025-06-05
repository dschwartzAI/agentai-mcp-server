# Agent.AI MCP Server

This is an externally deployable version of the Agent.AI MCP Server, designed to be hosted on Vercel and called from other applications.

## Deployment Instructions

### Prerequisites
- GitHub account
- Vercel account (free tier works)
- Git installed locally

### Steps to Deploy

1. **Create a new GitHub repository**
   ```bash
   git init
   git add .
   git commit -m "Initial commit: Agent.AI MCP Server"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/agentai-mcp-server.git
   git push -u origin main
   ```

2. **Deploy to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Click "New Project"
   - Import your GitHub repository
   - Vercel will automatically detect it as a Node.js project
   - Click "Deploy"

3. **Get your deployment URL**
   - After deployment, Vercel will provide a URL like: `https://your-project-name.vercel.app`
   - This is your MCP server endpoint

## Usage

Once deployed, you can call your MCP server from other applications using the Vercel URL.

### Example Usage
```javascript
// In your other app
const mcpServerUrl = 'https://your-project-name.vercel.app';

// Make requests to your MCP server
fetch(mcpServerUrl + '/your-endpoint')
  .then(response => response.json())
  .then(data => console.log(data));
```

## Local Development

To run locally:
```bash
npm install
npm start
```

The server will start on `http://localhost:3000`

## Configuration

- **Port**: Automatically set by Vercel, or defaults to 3000 locally
- **Environment Variables**: Can be set in Vercel dashboard under Project Settings > Environment Variables

## Troubleshooting

- Ensure your `@agentai/mcp-server` package is publicly available
- Check Vercel deployment logs if issues occur
- Verify your GitHub repository is public or Vercel has access

## Important: Disable Vercel Authentication

To allow external access to your MCP server, you MUST disable authentication in Vercel:

1. Go to your Vercel project dashboard
2. Click "Settings" → "Security"  
3. Disable "Password Protection" and "Vercel Authentication"
4. Save changes and redeploy

This ensures your app can call the MCP server without authentication barriers. 