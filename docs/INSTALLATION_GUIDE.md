# Omni AI Installation Guide

Complete guide for installing and running Omni AI on your system.

## System Requirements

- **Operating System**: macOS 10.15+, Windows 10+, or Linux (Ubuntu 20.04+)
- **RAM**: 2GB minimum (4GB recommended)
- **Disk Space**: 500MB (with all dependencies)
- **Node.js**: 20+ (included in pre-built packages)
- **Internet**: Required for LLM API calls

## Installation Methods

### Method 1: Pre-built Package (Recommended)

The easiest way to get started. Choose your platform:

#### macOS/Linux

1. **Download** the latest release:
   - Visit: https://github.com/your-org/omni-ai/releases
   - Download: `omni-ai-v1.0.0-macos-linux.tar.gz`

2. **Extract** the archive:
   ```bash
   tar -xzf omni-ai-v1.0.0-macos-linux.tar.gz
   cd omni-ai
   ```

3. **Configure** (create `.env.local`):
   ```bash
   cp .env.example .env.local
   ```
   Edit `.env.local` and add your API keys (see Configuration below)

4. **Run**:
   ```bash
   ./start.sh
   ```

5. **Access**: Open http://localhost:3000 in your browser

#### Windows

1. **Download** the latest release:
   - Visit: https://github.com/your-org/omni-ai/releases
   - Download: `omni-ai-v1.0.0-windows.zip`

2. **Extract** the archive:
   - Right-click on the ZIP file
   - Select "Extract All"
   - Navigate to the extracted `omni-ai` folder

3. **Configure** (create `.env.local`):
   - Copy `env.example` to `.env.local`
   - Edit `.env.local` and add your API keys (see Configuration below)

4. **Run**:
   - Double-click `start.bat`
   - Or open Command Prompt and run: `start.bat`

5. **Access**: Open http://localhost:3000 in your browser

### Method 2: From Source (For Developers)

Build and run from the source code:

1. **Clone** the repository:
   ```bash
   git clone https://github.com/your-org/omni-ai.git
   cd omni-ai
   ```

2. **Install** dependencies:
   ```bash
   npm install
   ```

3. **Build** omni-api-mcp:
   ```bash
   cd ../omni-api-mcp
   npm install
   npm run build
   cd ../omni-ai
   ```

4. **Configure** (create `.env.local`):
   ```bash
   cp .env.example .env.local
   ```
   Edit `.env.local` with your API keys

5. **Run** development server:
   ```bash
   npm run dev
   ```

6. **Access**: Open http://localhost:3000

## Configuration

### API Keys

Omni AI requires at least one LLM provider API key to function.

#### Required: At Least One LLM Provider

**Anthropic Claude** (Recommended):
```env
ANTHROPIC_API_KEY=sk-ant-...
```
- Get key: https://console.anthropic.com/

**OpenAI GPT**:
```env
OPENAI_API_KEY=sk-...
```
- Get key: https://platform.openai.com/api-keys

#### Optional: Additional Integrations

**DataDog** (for error investigation):
```env
DATADOG_API_KEY=...
DATADOG_APP_KEY=...
```
- Get keys: https://app.datadoghq.com/account/api-keys

**GitHub** (for repository analysis):
```env
GITHUB_TOKEN=ghp_...
```
- Generate: https://github.com/settings/tokens

**Stripe** (for payment analysis):
```env
STRIPE_API_KEY=sk_...
```
- Get key: https://dashboard.stripe.com/apikeys

### Provider Selection

By default, Omni AI uses Anthropic Claude. To use a different provider:

```env
SELECTED_PROVIDER=anthropic
# Options:
#   anthropic (default) - Claude models
#   openai - GPT models
#   azure - Azure OpenAI Service (enterprise)
#   aws - AWS Bedrock (enterprise)
#   gcp - GCP Vertex AI (enterprise)
```

**Note**: Changing provider requires restarting the app.

### Enterprise OAuth2 Gateway

For enterprise deployments with custom OAuth2:

```env
SELECTED_PROVIDER=azure
ANTHROPIC_BASE_URL=https://your-gateway.company.com/v1
```

Your gateway handles:
- OAuth2 authentication
- Model routing
- Rate limiting
- Audit logging

Contact your IT team for the correct gateway URL.

### Port Configuration

Default port is 3000. To use a different port:

```bash
# macOS/Linux
PORT=8080 ./start.sh

# Windows
set PORT=8080
start.bat
```

Then access at http://localhost:8080

### .env.local Example

```env
# LLM Provider (required)
ANTHROPIC_API_KEY=sk-ant-...

# Optional integrations
DATADOG_API_KEY=
GITHUB_TOKEN=
STRIPE_API_KEY=

# Provider selection (default: anthropic)
SELECTED_PROVIDER=anthropic

# Port (default: 3000)
PORT=3000
```

## Usage

### Starting the Application

**macOS/Linux**:
```bash
./start.sh
```

**Windows**:
```bash
start.bat
```

The app will:
1. Start the Next.js server
2. Initialize the MCP server (omni-api-mcp)
3. Print: "📍 Server will be available at http://localhost:3000"

### Accessing the Web Interface

1. Open http://localhost:3000 in your browser
2. You should see the Omni AI chat interface
3. Start investigating by typing your query

### Features

- **3 Intelligent Agents**: Auto-routing based on query type
- **30+ API Integrations**: Via omni-api-mcp
- **Session Persistence**: Conversations saved between sessions
- **Dark Mode**: Automatic or manual theme selection
- **Keyboard Shortcuts**: Cmd+K (Mac) or Ctrl+K (Windows/Linux) for commands

## Troubleshooting

### Port Already in Use

If you see "Port 3000 already in use":

**macOS/Linux**:
```bash
# Find and kill the process
lsof -ti:3000 | xargs kill -9

# Or use a different port
PORT=8080 ./start.sh
```

**Windows**:
```bash
# Find the process ID
netstat -ano | findstr :3000

# Kill it (replace PID with the actual process ID)
taskkill /PID <PID> /F

# Or use a different port
set PORT=8080
start.bat
```

### MCP Server Not Starting

If you see MCP connection errors:

1. **Verify the bundled MCP**:
   ```bash
   cd bundled-mcp/omni-api-mcp
   npm install --production
   npm run build
   cd ../..
   ```

2. **Rebuild the entire distribution**:
   ```bash
   npm run bundle
   ```

3. **Check logs** in browser console (F12) for detailed errors

### Missing API Keys

If you see "API key not configured":

1. Ensure `.env.local` exists in the app directory
2. Add at least one LLM provider key:
   ```env
   ANTHROPIC_API_KEY=sk-ant-...
   ```
3. Restart the app

### Blank Page on Startup

If the browser shows a blank page:

1. Check browser console (F12) for JavaScript errors
2. Check server logs for backend errors
3. Verify Node.js version: `node --version` (should be 20+)
4. Clear browser cache: Ctrl+Shift+Delete (Windows) or Cmd+Shift+Delete (Mac)

### Authentication Errors

If you see "401 Unauthorized" or "Invalid API Key":

1. Verify API key is correct in `.env.local`
2. Check key hasn't expired or been revoked
3. Ensure key has proper permissions/scopes
4. Restart the app after adding/changing keys

### Performance Issues

If the app is slow:

1. **Check system resources**:
   - RAM: Use Activity Monitor (Mac) or Task Manager (Windows)
   - Target: <500MB RAM usage

2. **Restart the app**:
   ```bash
   # Stop: Ctrl+C in terminal
   # Start: ./start.sh (or start.bat)
   ```

3. **Clear conversation history**:
   - Click Settings → Clear Conversations

## Updating

To update Omni AI to a new version:

1. **Download** the new release
2. **Extract** to a new directory
3. **Copy** your `.env.local` file to the new directory
4. **Run** the new version

Your conversation history is stored in:
- **macOS/Linux**: `~/.omni-ai/omni.db`
- **Windows**: `%APPDATA%\omni-ai\omni.db`

This persists across updates.

## Uninstallation

### Remove the Application

1. Stop the app (Ctrl+C)
2. Delete the `omni-ai` folder

### Remove All Data

1. Also delete the conversation history database:
   - **macOS/Linux**: `rm -rf ~/.omni-ai/`
   - **Windows**: Delete `%APPDATA%\omni-ai\` folder

## Building from Source

For developers who want to modify or rebuild:

### Build Production Distribution

```bash
# Build Next.js app
npm run build

# Create distribution bundle
npm run bundle

# Create installer packages
npm run installer
```

This creates:
- `dist/` - Production build (ready to run)
- `installers/` - Compressed archives for distribution

### Build Scripts

- `npm run dev` - Development server with hot reload
- `npm run build` - Next.js production build
- `npm run start` - Run production build
- `npm run bundle` - Create distribution bundle
- `npm run installer` - Create installer packages
- `npm run release` - Build + bundle + create installers (all-in-one)

## Support & Documentation

- **GitHub Issues**: https://github.com/your-org/omni-ai/issues
- **Documentation**: https://docs.omni-ai.com
- **Discord Community**: https://discord.gg/omni-ai

## Frequently Asked Questions

### Q: Can I use Omni AI offline?
A: No, Omni AI requires internet to access LLM APIs and third-party APIs (DataDog, GitHub, Stripe, etc.)

### Q: How much does it cost?
A: Omni AI itself is free. You pay for API usage:
- Anthropic Claude: ~$3-15 per million tokens
- OpenAI GPT: ~$1-20 per million tokens
- Optional integrations (DataDog, etc.) have their own pricing

### Q: Is my data private?
A: Yes. Conversations are stored locally in `~/.omni-ai/omni.db`. API calls are sent directly to the LLM provider (based on your `.env.local` configuration).

### Q: Can I run multiple instances?
A: Yes, use different ports:
```bash
PORT=3000 ./start.sh &  # Terminal 1
PORT=3001 ./start.sh    # Terminal 2
```

### Q: How do I reset to factory settings?
A: Delete the database and restart:
```bash
rm ~/.omni-ai/omni.db
./start.sh
```

### Q: Can I use this in a team?
A: Currently, each user runs their own instance on localhost. For team sharing, see the enterprise documentation at https://docs.omni-ai.com/enterprise

## License

Omni AI is released under the MIT License. See LICENSE file for details.
