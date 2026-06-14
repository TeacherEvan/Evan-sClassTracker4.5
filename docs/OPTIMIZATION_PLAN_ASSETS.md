# UI Asset Pipeline Optimization Plan

## 🎯 Objective

Automate the management of UI assets (icons, background images) using Figma as the source of truth. This replaces manual file drops with a scripted, reproducible workflow.

## 🛠 Tools Used

- **Figma MCP**: `mcp_figma_download_figma_images`
- **Memory MCP**: Track asset sync status
- **Sequential Thinking**: Planning and execution

## 📋 Current State Analysis

- **Logo**: CSS-based (no asset needed).
- **Backgrounds**: `rolling-vitruvian-men.tsx` uses hardcoded local images in `public/images/`.
- **Icons**: `public/` contains loose SVGs (`file.svg`, `globe.svg`, etc.).

## 🚀 Optimization Strategy

### 1. Centralize in Figma

Create a dedicated Figma file "Class Tracker Design System".

- **Page 1: Icons**: Contains `file`, `globe`, `window`, `next`, `vercel`.
- **Page 2: Assets**: Contains the space background images.

### 2. Automated Sync Script

Implement `scripts/sync-assets.ts` to:

1. Connect to Figma using the MCP tool.
2. Download specific nodes (by ID) to `public/images/` and `public/icons/`.
3. Optimize images on download (using Figma's export settings).

### 3. Memory Integration

Update the project's Knowledge Graph with the last sync timestamp and asset list.

## 💻 Implementation Details

### Script Structure (`scripts/sync-assets.ts`)

```typescript
// Pseudo-code for the sync script
import { useTools } from "mcp-sdk";

async function syncAssets() {
  const fileKey = process.env.FIGMA_FILE_KEY;

  // 1. Define Asset Mapping
  const assets = [
    { nodeId: "1:2", name: "globe.svg", path: "public/" },
    { nodeId: "1:3", name: "background.png", path: "public/images/" },
  ];

  // 2. Call MCP Tool
  await mcp_figma_download_figma_images({
    fileKey,
    nodes: assets.map((a) => ({ nodeId: a.nodeId, fileName: a.name })),
    localPath: "public/assets_temp", // Intermediate step
  });

  // 3. Move to final destinations
  // ...
}
```

## ✅ Benefits

- **Single Source of Truth**: Designers update Figma; developers run a script.
- **Version Control**: Assets are versioned with code.
- **Optimization**: Figma handles compression/export settings.
