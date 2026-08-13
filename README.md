# Cerrda · Personal Site

前端工程师 **Cerrda** 的个人主页 / 在线简历。基于 **Nuxt 4 + Tailwind CSS v4 + Inspira UI**，支持暗色与粉色浅色主题，可一键部署到 GitHub Pages。

## 本地开发

```bash
pnpm install
pnpm dev
```

## 静态生成

```bash
# 用户站 cerrda.github.io（根路径）
NUXT_APP_BASE_URL=/ pnpm generate

# 项目站 username.github.io/cerrda/
NUXT_APP_BASE_URL=/cerrda/ pnpm generate
```

产物目录：`.output/public`

## GitHub Pages

1. 仓库 Settings → Pages → Source 选 **GitHub Actions**
2. 推送到 `main` / `master` 后，工作流 `.github/workflows/deploy-pages.yml` 会自动 `pnpm generate` 并部署
3. 若是 **username.github.io** 用户站，请把 workflow 里的 `NUXT_APP_BASE_URL` 改成 `/`

## 内容替换

- 项目占位：`app/data/site.ts` → `projects`
- 文章源稿：`content/articles/*.md`（改完后运行 `node scripts/generate-articles.mjs`）
- 个人信息 / NPM / Skills：同文件 `siteProfile`、`packages`、`skills`

## 技术栈

- Nuxt 4（static / `nuxt generate`）
- Inspira UI（Silk、Morphing Text、Floating Card、Tracing Beam、Bento Grid、Liquid Glass、Light Speed 等）
- `marked` 渲染掘金迁移文章（`content/articles/*.md`）
- `@nuxtjs/color-mode` 暗色 / 粉色浅色切换
