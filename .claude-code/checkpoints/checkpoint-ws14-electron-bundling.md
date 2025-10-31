# WS14: Electron Bundling (OPTIONAL)

**Status**: Not Started
**Duration**: 3-5 days
**Dependencies**: WS13 complete
**Priority**: P2 (MEDIUM - Optional Enhancement)

---

## Objective

Package omni-ai as a native desktop application using Electron, for users who prefer traditional app experience over localhost server.

**Note**: This workstream is **OPTIONAL**. WS13 (Node.js distribution) is the primary distribution method. Only implement if native desktop app is specifically required.

---

## Why Electron (Optional)?

### Pros:
- Traditional desktop app experience
- No need to open browser manually
- Better integration with OS (dock/taskbar, notifications)
- Can use OS-native features (file system, clipboard)
- App icon and branding

### Cons:
- Larger bundle size (~150MB → ~250MB)
- More complex build process
- Platform-specific installers required
- Update mechanism more complex
- Additional testing required per platform

### Recommendation:
**Start with WS13 (Node.js localhost)** - simpler to build, maintain, and update. Only add Electron if users specifically request native app experience.

---

## Tasks

### Task 1: Install Electron & Configure (4-6 hours)

**Install Dependencies**:
```bash
npm install --save-dev electron electron-builder
npm install --save-dev @types/electron
```

**Electron Main Process**:
```typescript
// electron/main.ts
import { app, BrowserWindow } from 'electron';
import path from 'path';
import { spawn, ChildProcess } from 'child_process';

let mainWindow: BrowserWindow | null = null;
let mcpProcess: ChildProcess | null = null;
let nextProcess: ChildProcess | null = null;

const isDev = process.env.NODE_ENV === 'development';
const port = process.env.PORT || 3000;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1200,
    minHeight: 700,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    },
    titleBarStyle: 'hidden', // macOS
    frame: true,
    icon: path.join(__dirname, '../public/icon.png')
  });

  // Load Next.js app
  const startUrl = isDev
    ? `http://localhost:${port}`
    : `http://localhost:${port}`;

  mainWindow.loadURL(startUrl);

  // Dev tools in development
  if (isDev) {
    mainWindow.webContents.openDevTools();
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

function startMCPServer() {
  const mcpPath = isDev
    ? path.join(__dirname, '../../omni-api-mcp/dist/index.js')
    : path.join(process.resourcesPath, 'bundled-mcp/omni-api-mcp/dist/index.js');

  console.log('Starting MCP server:', mcpPath);

  mcpProcess = spawn('node', [mcpPath], {
    env: {
      ...process.env,
      OMNI_API_MCP_PATH: mcpPath
    },
    stdio: 'pipe'
  });

  mcpProcess.stdout?.on('data', (data) => {
    console.log('[MCP]', data.toString());
  });

  mcpProcess.stderr?.on('data', (data) => {
    console.error('[MCP Error]', data.toString());
  });

  mcpProcess.on('error', (err) => {
    console.error('MCP server error:', err);
  });

  mcpProcess.on('exit', (code) => {
    console.log('MCP server exited:', code);
  });
}

function startNextServer() {
  if (isDev) {
    // In dev, assume Next.js dev server is already running
    return;
  }

  const nextBinary = path.join(__dirname, '../node_modules/.bin/next');
  const nextDir = path.join(__dirname, '..');

  console.log('Starting Next.js server...');

  nextProcess = spawn(nextBinary, ['start', '-p', port.toString()], {
    cwd: nextDir,
    env: {
      ...process.env,
      NODE_ENV: 'production',
      OMNI_API_MCP_PATH: path.join(
        process.resourcesPath,
        'bundled-mcp/omni-api-mcp/dist/index.js'
      )
    },
    stdio: 'pipe'
  });

  nextProcess.stdout?.on('data', (data) => {
    console.log('[Next.js]', data.toString());
  });

  nextProcess.stderr?.on('data', (data) => {
    console.error('[Next.js Error]', data.toString());
  });
}

app.on('ready', async () => {
  // Wait a moment for everything to initialize
  await new Promise((resolve) => setTimeout(resolve, 1000));

  startMCPServer();
  startNextServer();

  // Wait for Next.js to be ready
  await new Promise((resolve) => setTimeout(resolve, 2000));

  createWindow();
});

app.on('window-all-closed', () => {
  if (mcpProcess) {
    mcpProcess.kill();
  }
  if (nextProcess) {
    nextProcess.kill();
  }

  app.quit();
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});
```

**Preload Script** (for security):
```typescript
// electron/preload.ts
import { contextBridge } from 'electron';

// Expose safe APIs to renderer if needed
contextBridge.exposeInMainWorld('electron', {
  platform: process.platform,
  version: process.versions.electron
});
```

**Validation**:
- [ ] Electron window opens
- [ ] Next.js app loads inside Electron
- [ ] MCP server starts automatically
- [ ] Dev tools work in development

---

### Task 2: Configure electron-builder (2-3 hours)

**Build Configuration**:
```json
// electron-builder.json
{
  "appId": "com.yourcompany.omni-ai",
  "productName": "Omni AI",
  "copyright": "Copyright © 2025 Your Company",
  "directories": {
    "output": "dist-electron",
    "buildResources": "electron/assets"
  },
  "files": [
    ".next/**/*",
    "public/**/*",
    "electron/dist/**/*",
    "package.json",
    "next.config.js",
    "!node_modules/**/*",
    "node_modules/**/*"
  ],
  "extraResources": [
    {
      "from": "bundled-mcp",
      "to": "bundled-mcp",
      "filter": ["**/*"]
    }
  ],
  "mac": {
    "category": "public.app-category.developer-tools",
    "target": [
      {
        "target": "dmg",
        "arch": ["x64", "arm64"]
      },
      {
        "target": "zip",
        "arch": ["x64", "arm64"]
      }
    ],
    "icon": "electron/assets/icon.icns",
    "hardenedRuntime": true,
    "gatekeeperAssess": false,
    "entitlements": "electron/entitlements.mac.plist",
    "entitlementsInherit": "electron/entitlements.mac.plist"
  },
  "win": {
    "target": [
      {
        "target": "nsis",
        "arch": ["x64"]
      },
      {
        "target": "portable",
        "arch": ["x64"]
      }
    ],
    "icon": "electron/assets/icon.ico"
  },
  "linux": {
    "target": ["AppImage", "deb", "rpm"],
    "category": "Development",
    "icon": "electron/assets/icon.png"
  },
  "nsis": {
    "oneClick": false,
    "allowToChangeInstallationDirectory": true,
    "createDesktopShortcut": true,
    "createStartMenuShortcut": true
  }
}
```

**Package Scripts**:
```json
{
  "scripts": {
    "electron:dev": "electron .",
    "electron:build": "tsc -p electron/tsconfig.json",
    "electron:dist": "npm run build:all && npm run electron:build && electron-builder",
    "electron:dist:mac": "npm run electron:dist -- --mac",
    "electron:dist:win": "npm run electron:dist -- --win",
    "electron:dist:linux": "npm run electron:dist -- --linux",
    "electron:dist:all": "npm run electron:dist -- --mac --win --linux"
  }
}
```

**Validation**:
- [ ] Build configuration valid
- [ ] Can build for current platform
- [ ] omni-api-mcp bundled correctly
- [ ] App size acceptable (<300MB)

---

### Task 3: Create App Icons (1-2 hours)

**Icon Requirements**:
- macOS: `.icns` (512x512, 256x256, 128x128, 64x64, 32x32, 16x16)
- Windows: `.ico` (256x256, 128x128, 64x64, 48x48, 32x32, 16x16)
- Linux: `.png` (512x512)

**Generate Icons**:
```bash
# Using electron-icon-builder
npm install --save-dev electron-icon-builder

# Create icon from source PNG (1024x1024)
npx electron-icon-builder --input=./icon-source.png --output=./electron/assets
```

**Validation**:
- [ ] Icons generated for all platforms
- [ ] Icons display correctly in OS

---

### Task 4: Add Auto-Update Support (2-3 hours)

**Install electron-updater**:
```bash
npm install electron-updater
```

**Update Main Process**:
```typescript
// electron/main.ts
import { autoUpdater } from 'electron-updater';

app.on('ready', () => {
  // ... existing code

  // Check for updates (production only)
  if (!isDev) {
    autoUpdater.checkForUpdatesAndNotify();

    autoUpdater.on('update-available', (info) => {
      console.log('Update available:', info);
      // Show notification to user
    });

    autoUpdater.on('update-downloaded', (info) => {
      console.log('Update downloaded:', info);
      // Prompt user to restart
    });
  }
});
```

**Publish Configuration**:
```json
// electron-builder.json
{
  "publish": {
    "provider": "github",
    "owner": "your-org",
    "repo": "omni-ai"
  }
}
```

**Validation**:
- [ ] Update check works
- [ ] Update download works
- [ ] App restarts with new version

---

### Task 5: Build & Test Installers (1-2 days)

**Build for All Platforms**:
```bash
# macOS (requires macOS)
npm run electron:dist:mac

# Windows (can build from any platform with wine)
npm run electron:dist:win

# Linux (can build from any platform with docker)
npm run electron:dist:linux

# All platforms (if on macOS with docker/wine)
npm run electron:dist:all
```

**Test Installers**:

**macOS**:
1. Open `.dmg` file
2. Drag to Applications
3. Launch from Applications
4. Verify app runs correctly
5. Test update mechanism

**Windows**:
1. Run `.exe` installer
2. Follow installation wizard
3. Launch from Start Menu
4. Verify app runs correctly

**Linux**:
1. Install `.AppImage` (chmod +x, then run)
2. Or install `.deb` (dpkg -i)
3. Verify app runs correctly

**Validation Checklist**:
- [ ] macOS DMG installs correctly
- [ ] Windows NSIS installer works
- [ ] Linux AppImage runs
- [ ] App launches without errors
- [ ] MCP server starts automatically
- [ ] UI renders correctly
- [ ] Can send messages to agents
- [ ] Multi-step investigations work
- [ ] Settings persist

---

### Task 6: Create Distribution Documentation (1 day)

**User Guide for Electron Version**:
```markdown
# Omni AI - Desktop App Installation

## Download

Visit [GitHub Releases](https://github.com/your-org/omni-ai/releases/latest) and download for your platform:

- **macOS**: `Omni-AI-1.0.0.dmg` (Apple Silicon + Intel)
- **Windows**: `Omni-AI-Setup-1.0.0.exe`
- **Linux**: `Omni-AI-1.0.0.AppImage`

## Installation

### macOS
1. Open the `.dmg` file
2. Drag **Omni AI** to Applications folder
3. Launch from Applications
4. If you see "unidentified developer" warning:
   - Right-click app → Open
   - Click "Open" in dialog

### Windows
1. Run `Omni-AI-Setup-1.0.0.exe`
2. Follow installation wizard
3. Launch from Start Menu or Desktop shortcut

### Linux
1. Make executable: `chmod +x Omni-AI-1.0.0.AppImage`
2. Run: `./Omni-AI-1.0.0.AppImage`
3. Or integrate with system:
   ```bash
   # Install AppImageLauncher for desktop integration
   sudo apt install appimagelauncher
   ./Omni-AI-1.0.0.AppImage
   ```

## Configuration

On first launch, configure API keys via Settings:

1. Open Settings (⚙️ icon in activity bar)
2. Add API keys:
   - Anthropic API Key (required)
   - DataDog API Key (optional)
   - GitHub Token (optional)
3. Select provider (Anthropic, OpenAI, Azure, etc.)
4. Click Save

Settings are stored in:
- macOS: `~/Library/Application Support/Omni AI/`
- Windows: `%APPDATA%/Omni AI/`
- Linux: `~/.config/Omni AI/`

## Updates

Omni AI checks for updates automatically on startup.

When an update is available:
1. Notification appears in app
2. Click "Download Update"
3. Update downloads in background
4. Click "Restart & Install"

## Uninstallation

### macOS
1. Quit Omni AI
2. Delete from Applications folder
3. Optionally delete settings:
   ```bash
   rm -rf ~/Library/Application\ Support/Omni\ AI
   ```

### Windows
1. Control Panel → Programs → Uninstall Omni AI
2. Or Settings → Apps → Omni AI → Uninstall

### Linux
1. Delete the AppImage file
2. Optionally delete settings:
   ```bash
   rm -rf ~/.config/Omni\ AI
   ```

## Troubleshooting

**App won't launch**:
- macOS: Check System Preferences → Security & Privacy
- Windows: Run as Administrator
- Linux: Verify file is executable

**MCP server errors**:
- Check Settings → ensure API keys are correct
- Restart app
- Check logs: Help → Show Logs

**Update failures**:
- Download new version manually from GitHub Releases
- Install over existing version
```

**Validation**:
- [ ] Documentation covers all platforms
- [ ] Installation steps clear
- [ ] Troubleshooting comprehensive

---

## Success Criteria

**Must Have** (for Electron version):
- ✅ Electron app builds for all platforms
- ✅ omni-api-mcp embedded correctly
- ✅ Installers work on all platforms
- ✅ App launches without errors
- ✅ Auto-update works
- ✅ Documentation complete

**Nice to Have**:
- ✅ Code signing for macOS/Windows
- ✅ Notarization for macOS
- ✅ CI/CD pipeline for releases
- ✅ Crash reporting

---

## Comparison: Node.js vs Electron

| Feature | WS13 (Node.js) | WS14 (Electron) |
|---------|----------------|-----------------|
| **Bundle Size** | ~150MB | ~250MB |
| **Installation** | Extract & run script | Platform-specific installer |
| **Updates** | Manual download | Auto-update built-in |
| **User Experience** | Browser-based | Native desktop app |
| **Complexity** | Low | Medium-High |
| **Maintenance** | Simple | Platform-specific testing |
| **Distribution** | Single archive | 3 platform builds |
| **Startup Time** | 2-3 seconds | 3-5 seconds |

**Recommendation**: Start with WS13 (Node.js). Only add WS14 if users specifically request native desktop app experience.

---

## References

- **Electron Documentation**: https://www.electronjs.org/docs
- **electron-builder**: https://www.electron.build/
- **Auto-updates**: https://www.electron.build/auto-update
- **WS13 (Primary Distribution)**: [checkpoint-ws13-nodejs-distribution.md](./checkpoint-ws13-nodejs-distribution.md)
