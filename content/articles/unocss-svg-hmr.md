---
title: "开发体验升级：UnoCSS 自定义 SVG 图标热更新方案"
description: "你在 src/assets/svg/ 里改了一个图标，保存，切回浏览器——图标还是旧的。刷新页面，还是旧的。重启 pnpm dev，终于对了。"
date: 2026-06-22
tags: ["UnoCSS", "SVG", "图标", "热更新"]
juejin: https://juejin.cn/post/7653373167660204078
slug: unocss-svg-hmr
---

# 开发体验升级：UnoCSS 自定义 SVG 图标热更新方案

> **Meta Description**：在 Vite + UnoCSS 项目中，用 chokidar 监听 SVG 目录、@iconify/tools 动态生成图标集，配合 `configDeps` 实现图标热更新，无需重启开发服务器。

---

## 引言

你在 `src/assets/svg/` 里改了一个图标，保存，切回浏览器——图标还是旧的。刷新页面，还是旧的。重启 `pnpm dev`，终于对了。

这种打断心流的体验，在图标频繁迭代的 UI 开发里尤其恼人。本文介绍一套基于 **UnoCSS `presetIcons` + chokidar 文件监听** 的 SVG 图标热更新方案：新增、修改、删除图标后，页面会自动刷新样式，VS Code 里的 Iconify 智能提示也会同步更新。

---

## 背景：为什么默认不会热更新？

UnoCSS 的 `presetIcons` 支持自定义图标集（custom collection），但图标数据通常在 **构建配置加载时** 就被读取并缓存了。如果只在 `uno.config.ts` 里写一次静态导入：

```ts
presetIcons({
  collections: {
    custom: () => fs.readFileSync('icons.json', 'utf8'),
  },
})
```

那么后续对 SVG 文件的改动，UnoCSS 并不知道需要重新生成 CSS。开发时就必须手动重启，或者忍受 stale 图标。

我们的目标是：**SVG 变动 → 重新生成图标集 → 通知 UnoCSS 重新编译 → 浏览器 HMR 刷新**。

---

## 整体架构

```mermaid
flowchart LR
  A[src/assets/svg/*.svg] -->|chokidar 监听| B[loadCustomIconSet]
  B -->|@iconify/tools| C[Iconify JSON]
  C -->|.vscode/icons.json| D[VS Code 智能提示]
  C -->|configDeps 触发| E[UnoCSS 重新编译]
  E -->|Vite HMR| F[浏览器图标即时更新]
```

三个关键拼图：

| 模块 | 职责 |
| --- | --- |
| `@iconify/tools` | 扫描 SVG 目录，优化路径，导出 Iconify 格式 JSON |
| `chokidar` | 开发环境下监听 SVG 增删改，触发重新加载 |
| `configDeps` | 告诉 UnoCSS：图标 JSON 变了，请重新跑一遍配置 |

---

## 完整实现代码

### 1. 安装依赖

```bash
pnpm add -D @iconify/tools chokidar
```

项目还需已有 UnoCSS 相关包（`unocss`、`@unocss/preset-rem-to-px` 等），此处不再赘述。

### 2. `uno.config.ts`（核心）

以下为项目中的完整配置，可直接复制使用：

```ts
import { existsSync } from 'node:fs'
import fs from 'node:fs/promises'
import {
  cleanupSVG,
  deOptimisePaths,
  importDirectorySync,
  runSVGO,
} from '@iconify/tools'
import { presetRemToPx } from '@unocss/preset-rem-to-px'
import chokidar from 'chokidar'
import { defineConfig, presetIcons, presetWind3 } from 'unocss'

type GlobalWithWatcher = typeof globalThis & {
  [WATCHER_KEY]?: boolean
}

const customIconPrefix = 'custom'
const customIconSvgDir = 'src/assets/svg'
const iconsJsonDir = '.vscode/icons.json'
const WATCHER_KEY = Symbol.for('unocss-svg-watcher')
const globalState = globalThis as GlobalWithWatcher

const hasCustomIconSvgDir = existsSync(customIconSvgDir)

/** 开发环境下监听 SVG 目录，文件变动时重新加载图标集 */
if (process.env.NODE_ENV === 'development' && hasCustomIconSvgDir && !globalState[WATCHER_KEY]) {
  chokidar.watch(customIconSvgDir, {
    ignoreInitial: true,
  }).on('add', () => {
    loadCustomIconSet()
  }).on('change', () => {
    loadCustomIconSet()
  }).on('unlink', () => {
    loadCustomIconSet()
  })
  globalState[WATCHER_KEY] = true
}

/**
 * @description: 扫描 SVG 目录，优化并导出 Iconify 图标集
 * @returns {() => IconifyJSON} 供 presetIcons 使用的图标集工厂函数
 */
const loadCustomIconSet = () => {
  const iconSet = importDirectorySync(customIconSvgDir, {
    prefix: customIconPrefix,
    keyword: (svg) => {
      if (!svg.subdir) {
        return svg.file
      }
      const prefix = svg.subdir.split('/').filter(Boolean).join('-')
      return `${prefix}-${svg.file}`
    },
  })

  iconSet.forEachSync((name) => {
    const svg = iconSet.toSVG(name)!
    cleanupSVG(svg)
    runSVGO(svg)
    deOptimisePaths(svg)
    iconSet.fromSVG(name, svg)
  })

  if (process.env.NODE_ENV === 'development') {
    const iconSetContent = iconSet.export()
    fs.writeFile(
      iconsJsonDir,
      JSON.stringify(iconSetContent, null, '\t'),
      'utf8',
    )
  }

  return () => iconSet.export()
}

export default defineConfig({
  shortcuts: {
    center: 'flex items-center justify-center',
  },
  rules: [[/^flex-([.\d]+)$/, ([_, num]) => ({ flex: `${num}` })]],
  theme: {
    colors: {
      primary: 'var(--el-color-primary)',
      danger: 'var(--el-color-danger)',
      success: 'var(--el-color-success)',
    },
  },
  presets: [
    presetWind3(),
    presetRemToPx({ baseFontSize: 4 }),
    presetIcons({
      ...(hasCustomIconSvgDir
        ? { collections: { [customIconPrefix]: loadCustomIconSet() } }
        : {}),
      extraProperties: {
        'display': 'inline-block',
        'vertical-align': 'middle',
      },
    }),
  ],
  /** 图标 JSON 变更时触发 UnoCSS 配置热重载 */
  configDeps: [iconsJsonDir],
})
```

> **说明**：原文仅监听了 `add` / `unlink`，编辑已有 SVG 时不会触发更新。上面补充了 `change` 事件，覆盖「修改图标内容」这一最常见场景。

### 3. 关键机制拆解

#### chokidar + 全局单例防重复注册

Vite 开发模式下可能多次加载 `uno.config.ts`。用 `Symbol.for('unocss-svg-watcher')` 挂在 `globalThis` 上，保证 watcher 只注册一次，避免重复监听、重复写文件。

#### `loadCustomIconSet` 的双重输出

1. **返回工厂函数** `() => iconSet.export()` —— 供 `presetIcons` 在 CSS 生成阶段读取图标 body。
2. **写入 `.vscode/icons.json`** —— 供 VS Code Iconify 插件做自动补全。

#### `configDeps`：热更新的最后一环

UnoCSS 会监视 `configDeps` 里列出的文件。当 `icons.json` 被 chokidar 回调重写后，UnoCSS 检测到依赖变更，重新执行配置并推送 HMR，浏览器里的 `i-custom-*` 类名对应的 background-image 就会更新。

### 4. VS Code Iconify 插件配置

在 `.vscode/settings.json` 中加入：

```json
{
  "iconify.excludes": ["el"],
  "iconify.customCollectionJsonPaths": ["./.vscode/icons.json"]
}
```

保存 SVG 后，`icons.json` 同步更新，输入 `i-custom-` 即可看到最新图标名提示。

### 5. `vite.config.ts` 中启用 UnoCSS

确保 Vite 插件链包含 UnoCSS（项目已有）：

```ts
import UnoCSS from 'unocss/vite'

export default defineConfig({
  plugins: [
    // ...
    UnoCSS({ inspector: false }),
  ],
})
```

入口文件引入 UnoCSS 样式：

```ts
// main.ts
import 'virtual:uno.css'
```

---

## 使用方式

### 目录约定

```
src/assets/svg/
├── confirm-circle-filled.svg   → i-custom-confirm-circle-filled
└── action/
    └── edit.svg                → i-custom-action-edit
```

子目录名会拼进图标 keyword：`{subdir}-{filename}`。

### 在模板中使用

```vue
<template>
  <!-- UnoCSS 图标类名：i-{prefix}-{icon-name} -->
  <span class="i-custom-confirm-circle-filled w-24px h-24px text-primary" />
</template>
```

图标颜色跟随 `currentColor`，可通过 `text-*` 或 `color-*` 控制。

---

## 验证热更新是否生效

1. 运行 `pnpm dev`，打开任意使用了 `i-custom-*` 的页面。
2. 修改 `src/assets/svg/confirm-circle-filled.svg` 中的路径或颜色，保存。
3. 观察终端：UnoCSS 应输出配置重载日志；浏览器图标应自动变化。
4. 在 VS Code 中输入 `i-custom-`，确认补全列表与磁盘文件一致。

若修改后无反应，请检查：

- `NODE_ENV` 是否为 `development`
- `.vscode/icons.json` 的时间戳是否更新
- 是否遗漏 `configDeps: [iconsJsonDir]`

---

## 总结

- **chokidar** 监听 SVG 目录，在增删改时调用 `loadCustomIconSet`
- **@iconify/tools** 负责扫描、SVGO 优化、导出 Iconify JSON
- **configDeps** 将 JSON 变更桥接到 UnoCSS HMR，实现浏览器端图标热更新
- **Iconify VS Code 插件** 读取同一份 JSON，编辑器与页面保持一致

---

## 下一步

- 将 `.vscode/icons.json` 加入 `.gitignore`（若团队不需要提交），或保留以便统一补全体验
- 按需扩展 `keyword` 规则，适配更复杂的目录结构
- 生产构建走静态快照，watcher 仅在开发环境启用，零运行时开销

如果你也在 Vite + UnoCSS 栈里维护自定义图标，不妨把这套方案搬进项目，告别「改图标 → 重启 dev」的循环。
