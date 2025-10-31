# WS13: Node.js Distribution (Self-Contained Localhost App)

**Status**: Not Started
**Duration**: 2-3 days
**Dependencies**: WS8-WS12 complete
**Priority**: P1 (HIGH)

---

## Objective

Package omni-ai as a self-contained Node.js application that runs on localhost with embedded omni-api-mcp. Users run via `npm start` or executable script.

**Distribution Model**: Simple localhost server (not Electron) - easier to distribute, update, and maintain.

---

## Tasks

### Task 1: Create Production Build Script (4-6 hours)

**Goal**: Build optimized Next.js production bundle

```json
// package.json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "build:mcp": "cd ../omni-api-mcp && npm run build",
    "build:all": "npm run build:mcp && npm run build",
    "bundle": "node scripts/bundle-distribution.js"
  }
}
```

**Build Distribution Script**:
```javascript
// scripts/bundle-distribution.js
const fs = require('fs-extra');
const path = require('path');
const { execSync } = require('child_process');

async function bundleDistribution() {
  console.log('Building omni-ai distribution...');

  // 1. Build Next.js app
  console.log('Building Next.js app...');
  execSync('npm run build', { stdio: 'inherit' });

  // 2. Create distribution directory
  const distDir = path.join(__dirname, '../dist');
  await fs.ensureDir(distDir);
  await fs.emptyDir(distDir);

  // 3. Copy Next.js build artifacts
  console.log('Copying Next.js build...');
  await fs.copy('.next', path.join(distDir, '.next'));
  await fs.copy('public', path.join(distDir, 'public'));
  await fs.copy('package.json', path.join(distDir, 'package.json'));
  await fs.copy('next.config.js', path.join(distDir, 'next.config.js'));

  // 4. Copy and bundle omni-api-mcp
  console.log('Bundling omni-api-mcp...');
  const mcpDir = path.join(distDir, 'bundled-mcp/omni-api-mcp');
  await fs.ensureDir(mcpDir);

  await fs.copy('../omni-api-mcp/dist', path.join(mcpDir, 'dist'));
  await fs.copy('../omni-api-mcp/package.json', path.join(mcpDir, 'package.json'));

  // Install MCP production dependencies
  console.log('Installing MCP dependencies...');
  execSync('npm install --production', {
    cwd: mcpDir,
    stdio: 'inherit'
  });

  // 5. Create launcher script
  console.log('Creating launcher scripts...');
  await createLauncherScripts(distDir);

  // 6. Install production dependencies
  console.log('Installing app dependencies...');
  execSync('npm install --production', {
    cwd: distDir,
    stdio: 'inherit'
  });

  // 7. Create README
  await createDistributionReadme(distDir);

  console.log('✅ Distribution built successfully at:', distDir);
  console.log('📦 Package size:', await getDirectorySize(distDir));
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

  await fs.writeFile(path.join(distDir, 'start.sh'), unixLauncher);
  await fs.chmod(path.join(distDir, 'start.sh'), '755');

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

  await fs.writeFile(path.join(distDir, 'start.bat'), windowsLauncher);
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

Create a \`.env.local\` file in this directory:

\`\`\`env
# API Keys
ANTHROPIC_API_KEY=sk-ant-...
OPENAI_API_KEY=sk-...

# DataDog (optional)
DATADOG_API_KEY=...
DATADOG_APP_KEY=...

# GitHub (optional)
GITHUB_TOKEN=ghp_...

# Provider Selection (default: anthropic)
SELECTED_PROVIDER=anthropic
# Options: anthropic, openai, azure, aws, gcp
\`\`\`

### Changing Provider

To use enterprise OAuth2 gateway:

1. Edit \`.env.local\`:
\`\`\`env
SELECTED_PROVIDER=azure
AZURE_GATEWAY_URL=https://your-gateway.com
AZURE_CLIENT_SECRET=...
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
└── .env.local             # Your configuration
\`\`\`

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
# Check MCP server
cd bundled-mcp/omni-api-mcp
npm run build
\`\`\`

### Missing Dependencies
\`\`\`bash
npm install --production
\`\`\`

## Updating

To update to a new version:

1. Download new distribution
2. Copy your \`.env.local\` to new directory
3. Run new launcher

Your conversation history is stored in \`~/.omni-ai/omni.db\` and will persist across updates.

## Support

- Issues: https://github.com/your-org/omni-ai/issues
- Docs: https://docs.omni-ai.com
`;

  await fs.writeFile(path.join(distDir, 'README.md'), readme);
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

bundleDistribution().catch(console.error);
```

**Validation**:
- [ ] Build script runs successfully
- [ ] Distribution directory created
- [ ] omni-api-mcp bundled correctly
- [ ] Launcher scripts executable
- [ ] Package size <200MB

---

### Task 2: Update MCP Path Resolution (1-2 hours)

**Goal**: Make MCP path work in both dev and production

```typescript
// lib/mcp/claude-sdk-mcp-config.ts
import path from 'path';

function getOmniApiMcpPath(): string {
  // 1. Check environment variable
  if (process.env.OMNI_API_MCP_PATH) {
    return process.env.OMNI_API_MCP_PATH;
  }

  // 2. Production: Use bundled MCP
  if (process.env.NODE_ENV === 'production') {
    return path.join(process.cwd(), 'bundled-mcp/omni-api-mcp/dist/index.js');
  }

  // 3. Development: Use sibling directory
  return path.join(process.cwd(), '../omni-api-mcp/dist/index.js');
}

export const omniApiMcpConfig: MCPServerConfig = {
  type: 'stdio',
  command: 'node',
  args: [getOmniApiMcpPath()],
  env: {
    ...process.env,
  },
};
```

**Validation**:
- [ ] Works in development
- [ ] Works in production
- [ ] Custom path via env var works

---

### Task 3: Create Installer Package (2-3 hours)

**Goal**: Create distributable archives

```javascript
// scripts/create-installer.js
const archiver = require('archiver');
const fs = require('fs-extra');
const path = require('path');

async function createInstallers() {
  const distDir = path.join(__dirname, '../dist');
  const installersDir = path.join(__dirname, '../installers');
  await fs.ensureDir(installersDir);

  const version = require('../package.json').version;

  // Create tar.gz for macOS/Linux
  console.log('Creating tar.gz for macOS/Linux...');
  await createArchive(
    distDir,
    path.join(installersDir, `omni-ai-v${version}-macos-linux.tar.gz`),
    'tar'
  );

  // Create zip for Windows
  console.log('Creating zip for Windows...');
  await createArchive(
    distDir,
    path.join(installersDir, `omni-ai-v${version}-windows.zip`),
    'zip'
  );

  console.log('✅ Installers created at:', installersDir);
}

async function createArchive(sourceDir, outputPath, format) {
  const output = fs.createWriteStream(outputPath);
  const archive = archiver(format, {
    gzip: format === 'tar',
    gzipOptions: { level: 9 }
  });

  return new Promise((resolve, reject) => {
    output.on('close', resolve);
    archive.on('error', reject);

    archive.pipe(output);
    archive.directory(sourceDir, 'omni-ai');
    archive.finalize();
  });
}

createInstallers().catch(console.error);
```

**Package Scripts**:
```json
{
  "scripts": {
    "bundle": "node scripts/bundle-distribution.js",
    "installer": "node scripts/create-installer.js",
    "release": "npm run build:all && npm run bundle && npm run installer"
  }
}
```

**Validation**:
- [ ] tar.gz created for Unix
- [ ] zip created for Windows
- [ ] Archives extract correctly
- [ ] Can run from extracted directory

---

### Task 4: Add Auto-Update Support (Optional - 2-3 hours)

**Goal**: Check for updates on startup

```typescript
// lib/update/version-check.ts
export async function checkForUpdates() {
  try {
    const currentVersion = require('../../package.json').version;

    const response = await fetch('https://api.github.com/repos/your-org/omni-ai/releases/latest');
    const latest = await response.json();

    if (latest.tag_name > `v${currentVersion}`) {
      return {
        hasUpdate: true,
        latestVersion: latest.tag_name,
        downloadUrl: latest.html_url,
        releaseNotes: latest.body
      };
    }

    return { hasUpdate: false };
  } catch (error) {
    console.error('Failed to check for updates:', error);
    return { hasUpdate: false };
  }
}
```

**UI Banner**:
```typescript
// components/update-banner.tsx
export function UpdateBanner() {
  const [update, setUpdate] = useState<any>(null);

  useEffect(() => {
    checkForUpdates().then(setUpdate);
  }, []);

  if (!update?.hasUpdate) return null;

  return (
    <Alert>
      <Download className="h-4 w-4" />
      <AlertTitle>Update Available</AlertTitle>
      <AlertDescription>
        Version {update.latestVersion} is available.{' '}
        <a href={update.downloadUrl} className="underline">
          Download now
        </a>
      </AlertDescription>
    </Alert>
  );
}
```

**Validation**:
- [ ] Update check works
- [ ] Banner displays correctly
- [ ] Download link works

---

### Task 5: Create Installation Documentation (1 day)

**User Guide**:
```markdown
# Omni AI Installation Guide

## System Requirements

- Node.js 18+ (bundled in installers)
- 2GB RAM minimum
- 500MB disk space
- macOS 11+, Windows 10+, or Linux (Ubuntu 20.04+)

## Installation

### Option 1: Pre-built Package (Recommended)

1. **Download**:
   - macOS/Linux: `omni-ai-v1.0.0-macos-linux.tar.gz`
   - Windows: `omni-ai-v1.0.0-windows.zip`

2. **Extract**:
   ```bash
   # macOS/Linux
   tar -xzf omni-ai-v1.0.0-macos-linux.tar.gz
   cd omni-ai

   # Windows: Right-click → Extract All
   ```

3. **Configure** (create `.env.local`):
   ```env
   ANTHROPIC_API_KEY=sk-ant-...
   DATADOG_API_KEY=...
   GITHUB_TOKEN=ghp_...
   ```

4. **Run**:
   ```bash
   # macOS/Linux
   ./start.sh

   # Windows
   start.bat
   ```

5. **Open Browser**: http://localhost:3000

### Option 2: From Source

```bash
# Clone repository
git clone https://github.com/your-org/omni-ai.git
cd omni-ai

# Install dependencies
npm install

# Build omni-api-mcp
cd ../omni-api-mcp && npm run build && cd ../omni-ai

# Start development server
npm run dev
```

## Configuration

### API Keys

Required for basic functionality:
- **Anthropic API Key**: For Claude models (primary)
- **OpenAI API Key**: For GPT models (optional)

Optional integrations:
- **DataDog**: Error investigation features
- **GitHub**: Repository analysis features
- **Stripe**: Payment analysis features

### Enterprise OAuth2 Gateway

For enterprise deployments with custom OAuth2:

```env
SELECTED_PROVIDER=azure
AZURE_GATEWAY_URL=https://your-gateway.company.com
AZURE_CLIENT_SECRET=...
```

Supported providers:
- Azure OpenAI Service
- AWS Bedrock
- GCP Vertex AI

## Troubleshooting

### Common Issues

**Port 3000 already in use**:
```bash
PORT=8080 ./start.sh
```

**MCP server not starting**:
```bash
cd bundled-mcp/omni-api-mcp
npm install --production
npm run build
```

**API key errors**:
- Check `.env.local` exists and contains valid keys
- Restart app after changing configuration

## Uninstallation

1. Stop the app
2. Delete the `omni-ai` directory
3. Optionally delete `~/.omni-ai/` (conversation history)

## Support

- GitHub Issues: https://github.com/your-org/omni-ai/issues
- Documentation: https://docs.omni-ai.com
- Discord: https://discord.gg/omni-ai
```

**Validation**:
- [ ] Installation instructions clear
- [ ] All platforms covered
- [ ] Troubleshooting section comprehensive

---

## Success Criteria

**Must Have**:
- ✅ Production build script works
- ✅ Bundled omni-api-mcp functional
- ✅ Launcher scripts for all platforms
- ✅ Installer packages created
- ✅ Installation documentation complete
- ✅ Package size <200MB

**Nice to Have**:
- ✅ Auto-update check
- ✅ Version banner in UI
- ✅ Crash reporting
- ✅ Usage analytics (opt-in)

---

## Distribution Workflow

```bash
# 1. Build everything
npm run build:all

# 2. Create distribution bundle
npm run bundle

# 3. Test distribution locally
cd dist
./start.sh
# Visit http://localhost:3000

# 4. Create installer packages
npm run installer

# 5. Upload to GitHub Releases
# - Upload installers/omni-ai-v1.0.0-macos-linux.tar.gz
# - Upload installers/omni-ai-v1.0.0-windows.zip
# - Add release notes
```

---

## References

- **Next.js Production**: https://nextjs.org/docs/deployment
- **Node.js Packaging**: https://nodejs.org/en/docs/guides/getting-started-guide
- **WS14 (Electron - Optional)**: [checkpoint-ws14-electron-bundling.md](./checkpoint-ws14-electron-bundling.md)
