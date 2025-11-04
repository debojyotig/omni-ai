const fs = require('fs-extra');
const path = require('path');
const { execSync } = require('child_process');

async function bundleDistribution() {
  console.log('🚀 Building omni-ai distribution...');

  // 1. Build Next.js app
  console.log('\n📦 Building Next.js app...');
  execSync('npm run build', { stdio: 'inherit' });

  // 2. Create distribution directory
  const distDir = path.join(__dirname, '../dist');
  await fs.ensureDir(distDir);
  await fs.emptyDir(distDir);
  console.log(`✅ Distribution directory created: ${distDir}`);

  // 3. Copy Next.js build artifacts
  console.log('\n📋 Copying Next.js build...');
  await fs.copy('.next', path.join(distDir, '.next'));
  console.log('  ✓ .next');
  await fs.copy('public', path.join(distDir, 'public'));
  console.log('  ✓ public');
  await fs.copy('package.json', path.join(distDir, 'package.json'));
  console.log('  ✓ package.json');
  await fs.copy('next.config.js', path.join(distDir, 'next.config.js'));
  console.log('  ✓ next.config.js');

  // 4. Copy and bundle omni-api-mcp
  console.log('\n🔗 Bundling omni-api-mcp...');
  const mcpDir = path.join(distDir, 'bundled-mcp/omni-api-mcp');
  await fs.ensureDir(mcpDir);

  // Check if omni-api-mcp exists in parent directory
  const omniApiMcpPath = path.join(__dirname, '../../omni-api-mcp');
  if (!fs.existsSync(omniApiMcpPath)) {
    throw new Error(`omni-api-mcp not found at ${omniApiMcpPath}`);
  }

  // Check if omni-api-mcp/dist exists, if not build it
  const distMcpPath = path.join(omniApiMcpPath, 'dist');
  if (!fs.existsSync(distMcpPath)) {
    console.log('  ℹ️  omni-api-mcp/dist not found, building...');
    execSync('npm run build', {
      cwd: omniApiMcpPath,
      stdio: 'inherit'
    });
  }

  await fs.copy(distMcpPath, path.join(mcpDir, 'dist'));
  console.log('  ✓ dist');
  await fs.copy(path.join(omniApiMcpPath, 'package.json'), path.join(mcpDir, 'package.json'));
  console.log('  ✓ package.json');

  // Install MCP production dependencies
  console.log('\n📥 Installing MCP dependencies...');
  execSync('npm install --production --omit=dev', {
    cwd: mcpDir,
    stdio: 'inherit'
  });

  // 5. Create launcher scripts
  console.log('\n🛠️  Creating launcher scripts...');
  await createLauncherScripts(distDir);

  // 6. Install production dependencies
  console.log('\n📥 Installing app dependencies...');
  execSync('npm install --production --omit=dev', {
    cwd: distDir,
    stdio: 'inherit'
  });

  // 7. Create README
  console.log('\n📝 Creating README...');
  await createDistributionReadme(distDir);

  // 8. Create .env.example
  console.log('📝 Creating .env.example...');
  await createEnvExample(distDir);

  const size = await getDirectorySize(distDir);
  console.log(`\n✅ Distribution built successfully!`);
  console.log(`📍 Location: ${distDir}`);
  console.log(`📊 Size: ${size}`);
  console.log('\n🎯 Next steps:');
  console.log(`  1. cd dist`);
  console.log(`  2. cp .env.example .env.local`);
  console.log(`  3. Add your API keys to .env.local`);
  console.log(`  4. ./start.sh (or start.bat on Windows)`);
}

async function createLauncherScripts(distDir) {
  // Unix launcher (macOS/Linux)
  const unixLauncher = `#!/bin/bash
cd "$(dirname "$0")"

echo "🚀 Starting Omni AI..."
echo "📍 Server will be available at http://localhost:3000"
echo ""

export OMNI_API_MCP_PATH="./bundled-mcp/omni-api-mcp/dist/index.js"

npm start

echo ""
echo "👋 Omni AI stopped"
`;

  const unixPath = path.join(distDir, 'start.sh');
  await fs.writeFile(unixPath, unixLauncher);
  await fs.chmod(unixPath, '755');
  console.log('  ✓ start.sh (Unix/Linux/macOS)');

  // Windows launcher
  const windowsLauncher = `@echo off
cd /d "%~dp0"

echo 🚀 Starting Omni AI...
echo 📍 Server will be available at http://localhost:3000
echo.

set OMNI_API_MCP_PATH=.\\bundled-mcp\\omni-api-mcp\\dist\\index.js

npm start

echo.
echo 👋 Omni AI stopped
pause
`;

  const windowsPath = path.join(distDir, 'start.bat');
  await fs.writeFile(windowsPath, windowsLauncher);
  console.log('  ✓ start.bat (Windows)');
}

async function createDistributionReadme(distDir) {
  const readme = `# Omni AI - Self-Contained Distribution

## Quick Start

### macOS/Linux:
\`\`\`bash
./start.sh
\`\`\`

### Windows:
Double-click \`start.bat\` or run:
\`\`\`cmd
start.bat
\`\`\`

The app will be available at **http://localhost:3000**

## Configuration

### Environment Variables

1. Copy \`.env.example\` to \`.env.local\`:
\`\`\`bash
cp .env.example .env.local
\`\`\`

2. Edit \`.env.local\` with your API keys:
\`\`\`env
# Required: At least one LLM API key
ANTHROPIC_API_KEY=sk-ant-...
# or
OPENAI_API_KEY=sk-...

# Optional: For DataDog investigation features
DATADOG_API_KEY=...
DATADOG_APP_KEY=...

# Optional: For GitHub integration
GITHUB_TOKEN=ghp_...

# Optional: For Stripe payment analysis
STRIPE_API_KEY=sk_...

# Provider Selection (default: anthropic)
SELECTED_PROVIDER=anthropic
# Options: anthropic, openai, azure, aws, gcp
\`\`\`

### Enterprise OAuth2 Gateway

To use enterprise OAuth2 gateway:

1. Edit \`.env.local\`:
\`\`\`env
SELECTED_PROVIDER=azure
ANTHROPIC_BASE_URL=https://your-gateway.com/v1
\`\`\`

2. Restart the app

### Port Configuration

Default port: 3000

To change port:
\`\`\`bash
PORT=8080 ./start.sh  # Unix
set PORT=8080 && start.bat  # Windows
\`\`\`

## Directory Structure

\`\`\`
omni-ai/
├── .next/                  # Next.js build
├── bundled-mcp/            # Embedded MCP server
│   └── omni-api-mcp/      # omni-api-mcp (30+ APIs)
├── public/                 # Static assets
├── start.sh               # Unix launcher
├── start.bat              # Windows launcher
├── package.json           # Dependencies
├── .env.example           # Configuration template
└── .env.local             # Your configuration (create manually)
\`\`\`

## Features

- 🤖 **3 Intelligent Agents**: Auto-routing to specialists based on query intent
- 📊 **Multi-API Investigation**: Correlate data across 30+ enterprise APIs
- 🔍 **Root Cause Analysis**: Automatic error investigation and timeline correlation
- 💾 **Session Persistence**: Conversations saved across restarts
- 🌙 **Dark Mode**: System preference or manual toggle
- ⌨️ **Keyboard Shortcuts**: Cmd+K for command palette
- 📱 **Responsive Design**: Works on desktop, tablet, and mobile browsers

## System Requirements

- Node.js 18+ (included in bundled distribution)
- 2GB RAM minimum
- 500MB disk space
- macOS 10.15+, Windows 10+, or Linux (Ubuntu 20.04+)

## Troubleshooting

### Port Already in Use
\`\`\`bash
# Kill process on port 3000
# macOS/Linux:
lsof -ti:3000 | xargs kill -9

# Windows:
netstat -ano | findstr :3000
taskkill /PID <PID> /F
\`\`\`

### MCP Server Issues
\`\`\`bash
# Rebuild MCP server
cd bundled-mcp/omni-api-mcp
npm run build
\`\`\`

### Missing Dependencies
\`\`\`bash
npm install --production
\`\`\`

### No API Key Configured
- Ensure \`.env.local\` exists with \`ANTHROPIC_API_KEY\` or \`OPENAI_API_KEY\`
- Restart the app after adding keys

## Updating

To update to a new version:

1. Download new distribution
2. Copy your \`.env.local\` to new directory
3. Run new launcher

Your conversation history is stored in \`.omni-ai/omni.db\` and will persist across updates.

## Architecture

\`\`\`
Browser → Next.js Server (3000) → Claude Agent SDK → MCP Server (stdio)
                                                    ↓
                                          omni-api-mcp (30+ APIs)
\`\`\`

## Building from Source

If you want to modify or rebuild:

\`\`\`bash
# Install dependencies
npm install

# Development
npm run dev

# Production build
npm run build
npm run bundle
npm run installer
\`\`\`

## Support

- Issues: https://github.com/your-org/omni-ai/issues
- Docs: https://docs.omni-ai.com

## License

MIT
`;

  await fs.writeFile(path.join(distDir, 'README.md'), readme);
}

async function createEnvExample(distDir) {
  const envExample = `# API Configuration
# Add your API keys here. At least one LLM provider is required.

# Anthropic Claude (Recommended)
ANTHROPIC_API_KEY=sk-ant-...

# OpenAI GPT models
OPENAI_API_KEY=sk-...

# DataDog (Optional - for error investigation)
DATADOG_API_KEY=
DATADOG_APP_KEY=

# GitHub (Optional - for repository analysis)
GITHUB_TOKEN=ghp_...

# Stripe (Optional - for payment analysis)
STRIPE_API_KEY=sk_...

# Provider Selection
# Restart app after changing provider
# Options: anthropic (default), openai, azure, aws, gcp
SELECTED_PROVIDER=anthropic

# Enterprise OAuth2 Gateway (Optional)
# Uncomment and set for enterprise deployments
# ANTHROPIC_BASE_URL=https://your-gateway.company.com/v1

# Port Configuration (Optional)
# Default: 3000
# PORT=3000

# Node Environment
# Default: production
# NODE_ENV=production
`;

  await fs.writeFile(path.join(distDir, '.env.example'), envExample);
}

async function getDirectorySize(dir) {
  let size = 0;

  const files = await fs.readdir(dir, { withFileTypes: true });
  for (const file of files) {
    const filePath = path.join(dir, file.name);
    if (file.isDirectory()) {
      size += await getDirectorySize(filePath);
    } else {
      const stats = await fs.stat(filePath);
      size += stats.size;
    }
  }

  return `${(size / 1024 / 1024).toFixed(2)} MB`;
}

bundleDistribution().catch((err) => {
  console.error('❌ Error building distribution:', err.message);
  process.exit(1);
});
