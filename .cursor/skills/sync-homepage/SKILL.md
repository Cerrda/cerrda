---
name: sync-homepage
description: Syncs Cerrda's Juejin articles, skills.sh Agent Skills, and npm packages into this Nuxt personal homepage, then writes homepage copy (summaries, descriptions, tags, points). Use when the user asks to 同步主页, 同步掘金, 同步 skills, 同步 npm, refresh homepage content, or pull remote article/package/skill updates onto the site.
disable-model-invocation: true
---

# Sync Homepage

脚本只搬运事实（id、版本、正文、安装命令）。首页上的 **description / summary / tags / points**，以及 slug、标题是否改写，必须由 Agent 根据远端材料判断并填写。

不要把 npm `description`、SKILL.md `description`、掘金 `brief_content` 原样写进 JSON。那样等于没用本 Skill。

不要手改 `app/pages/index.vue` 去堆内容。首页读的是 `app/data/*.json`。

```
.cursor/skills/sync-homepage/
├── SKILL.md
├── reference.md
└── scripts/
    ├── sync-homepage.mjs
    └── homepage-sources.json
```

## Quick start

```
Task Progress:
- [ ] 确认范围（默认全部；用户说「只同步掘金/skills/npm」时加 --only）
- [ ] 运行本 Skill 的 scripts/sync-homepage.mjs（不要 --dry-run）
- [ ] 读 content/_raw/sync-copy-brief.json
- [ ] 对 copyQueue 每一项：阅读源材料 → 判断 → 写入首页文案
- [ ] 新文章补 slug / frontmatter，然后 node scripts/generate-articles.mjs
- [ ] copyQueue 全部填完后再向用户汇报；不要提交 git
```

## Commands

在仓库根目录执行：

```bash
node .cursor/skills/sync-homepage/scripts/sync-homepage.mjs
```

```bash
node .cursor/skills/sync-homepage/scripts/sync-homepage.mjs --only=articles
node .cursor/skills/sync-homepage/scripts/sync-homepage.mjs --only=skills
node .cursor/skills/sync-homepage/scripts/sync-homepage.mjs --only=packages
```

不要发明第二套抓取逻辑。

## Agent 必须写文案（本 Skill 的核心）

脚本跑完后读 `content/_raw/sync-copy-brief.json`（与 report.copyQueue 相同）。**队列未清空前禁止说同步完成。**

对每一项：

1. 读 `remote`（以及 `sourceFile` 指向的 markdown / 摘要）。
2. 对照 `local`（若有）和现有首页卡片语气。
3. **判断**要新建、改写还是维持。正文小改且首页描述仍准确 → 维持，并在汇报里说明「文案未改」。
4. 把结果写进对应 JSON；新文章还要改 `content/articles/{slug}.md` 的 frontmatter。

### 文章 `kind: article`

写 `app/data/articles.json`：

- `slug`：语义化 kebab-case。草稿是 `post-xxxxxxxx` 或英文碎片时必须改。参考：`vue3-vcopy`、`fnm-windows`、`faker-mock-setup-skill`。
- `title`：默认可沿用掘金标题；过长、口语或 SEO 堆词时再压成首页可读标题，不要另起一篇的意思。
- `description`：一句中文，讲文章解决什么问题，不要复制 brief。
- `tags`：1–3 个，对齐现有风格（`前端`、`Vue.js`、`Agent Skill`），不要堆掘金热门标签。
- `date`：用脚本写入的日期，不要改。

`reason: added` → 必须写 description 和 tags，并审 slug。  
`reason: updatedBody` → 读新正文，判断 description/tags 是否仍准确。

### Skill `kind: skill`

写 `app/data/skills.json`：

- `summary`：一句中文，说这个 Skill 让 Agent 干什么。
- `points`：恰好 3 条短中文能力点，不是 README 目录，不是 description 切片。
- `href` / `install`：脚本已填，不要改格式。

`reason: added` → 必须写 summary + 3 points。  
`reason: skillUpdated` → 对照新 SKILL.md，判断是否改写。

### npm 包 `kind: package`

写 `app/data/packages.json`：

- `summary`：一句中文。禁止直接用 registry 英文 description。
- `points`：恰好 3 条，讲能力与适用场景。
- `role`：作者包=`作者`；贡献包保持 `贡献者`。
- `href`：`https://npmx.dev/package/{name}`。

`reason: added` → 必须写 summary + 3 points。  
`reason: versionBump` → 读 changelog/readme 摘要，判断 points 是否要跟上新版本。

不想上首页的包写入本 Skill `scripts/homepage-sources.json` → `npm.exclude`。

## 文案标准

对齐现有卡片：中文、具体、工程语气。一句 summary / description，三条 points。

**Skill 示例（保持这个密度）：**

```
summary: 按 OpenAPI / 函数名生成页面级 Faker overrideResponse Mock。
points: 函数名或 URL → ApiId | 生成 setup{ApiId}MockHandler | Vue / Vite + MSW 联调
```

**npm 示例：**

```
summary: 自动获取远程 Vue / Web Components 类型声明的 Vite 插件。
points: 扫描远程 import，并行拉取类型并生成全局组件声明 | 支持热更新、source map、多正则匹配 | 让微前端 / CDN 组件在本地获得完整 TypeScript 体验
```

**文章 description 示例：**

```
按 config.py 的 id 生成 scrapling 脚本并写入 SQLite，把翻页校验与增量采集固化成 Agent Skill。
```

禁止：英文原句上首页、口号、超过 3 条 points、把安装命令写进 summary。

## 不要动

- `careerTimeline`、`siteProfile`（除非用户明确要求）
- copyQueue 之外、远端也没变的已有文案
- 已有文章的手工 slug（除非用户要求改）

## Report to the user

用中文列出：新增/更新了哪些条目、文案是新建还是改写还是维持。不要提交 commit。

## Additional resources

- 数据源、字段与合并规则见 [reference.md](reference.md)
