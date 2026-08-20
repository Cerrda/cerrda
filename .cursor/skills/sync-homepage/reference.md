# Homepage sync reference

## Division of labor

| 谁                              | 做什么                                                                                                            |
| ------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| `scripts/sync-homepage.mjs`     | 拉远端事实：文章正文、包版本、Skill 文件、安装链接。新条目的 `summary` / `description` / `points` / `tags` 留空。 |
| Agent（本 Skill）               | 读 `content/_raw/sync-copy-brief.json`，根据远端材料判断并撰写首页文案，写入 `app/data/*.json`。                  |
| `scripts/generate-articles.mjs` | md → `public/articles/*.html`（站点构建，不是文案）                                                               |

脚本写出空文案骨架后，首页卡片会缺描述。这是预期。Agent 必须在同一轮补完。

## Files

| File                                             | Who writes it                                     | Who reads it         |
| ------------------------------------------------ | ------------------------------------------------- | -------------------- |
| `scripts/homepage-sources.json`（本 Skill 目录） | Agent + sync script                               | Sync script          |
| `app/data/articles.json`                         | 脚本写骨架；Agent 写 title/description/tags/slug  | `site.ts`、prerender |
| `app/data/skills.json`                           | 脚本写 name/href/install；Agent 写 summary/points | 首页 Skills          |
| `app/data/packages.json`                         | 脚本写 name/version/href；Agent 写 summary/points | 首页 NPM             |
| `content/articles/{slug}.md`                     | 脚本写正文；Agent 同步 frontmatter                | generate-articles    |
| `content/_raw/sync-copy-brief.json`              | 脚本                                              | Agent 文案队列       |
| `content/_raw/sync-report.json`                  | 脚本                                              | 变更总览             |

## Source config

本 Skill 的 `scripts/homepage-sources.json`：

- `juejinUserId` / `githubSkillsRepo` / `skillsShProfile` / `npmMaintainer`
- `npm.pinned`：固定展示（含贡献者包）
- `npm.exclude`：发现了但不想上首页
- `articleSlugs`：`掘金 id → slug`，Agent 改 slug 后必须回填
- `skillHashes`：脚本维护，用于发现 SKILL.md 变更

## copyQueue item

```json
{
  "kind": "article | skill | package",
  "reason": "added | updatedBody | skillUpdated | versionBump",
  "remote": {},
  "local": null
}
```

- `added`：必须新写文案
- `updatedBody` / `skillUpdated` / `versionBump`：必须判断现有文案还准不准；不准就改，准就维持并在汇报里说

## Merge rules（脚本侧）

### Articles

1. 顺序跟掘金最新优先。
2. 已有条目：保留本地 title/description/date/tags/slug；只更新 markdown 正文。
3. 新条目：title/date 用掘金；description 与 tags 留空给 Agent。
4. 掘金下架：不删本地文件。

### Skills

1. 目录名 = `name`。href/install 由脚本填。
2. 已有 summary/points 脚本不覆盖。
3. 新条目：summary `""`，points `[]`。
4. SKILL.md hash 变化 → `skillUpdated` 进 copyQueue。

### Packages

1. `pinned` 顺序即首页顺序。
2. 已有条目：只改 `version`。
3. 新作者包：summary `""`，points `[]`，role `作者`。
4. 贡献者包必须留在 `pinned`。

## Related scripts

- `node .cursor/skills/sync-homepage/scripts/sync-homepage.mjs` — 拉事实、写 copyQueue
- `node scripts/generate-articles.mjs` — md → HTML
