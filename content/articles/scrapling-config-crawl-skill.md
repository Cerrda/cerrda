---
title: "把配置驱动爬虫做成可安装 Skill：scrapling-config-crawl"
description: "把按 config.py id 生成 scrapling 脚本并写入 SQLite 的流程固化为可安装 Agent Skill，覆盖 list/data 增量采集与翻页校验。"
date: 2026-08-12
tags: ["爬虫", "Python", "Agent", "Skill"]
juejin: https://juejin.cn/post/7672698563611197490
slug: scrapling-config-crawl-skill
---

> 仓库：[Cerrda/skills](https://github.com/Cerrda/skills)\
> 安装：`npx skills add Cerrda/skills --skill scrapling-config-crawl`

写爬虫最耗人的往往不是「会不会写 requests」，而是：**每个站分页规则不同、增量怎么比、详情附件怎么下、翻页一不小心就跳页**。\
我们把「按 `config.py` 的 id 生成 scrapling 脚本 + 写 SQLite」固化成 Agent Skill，并推进 [skills.sh](https://skills.sh/)——一行命令装上，对话里丢 `id` 就能跑完整流程。

***

## 免责声明（请先读）

![juejin-crawl-disclaimer.png](https://p3-xtjj-sign.byteimg.com/tos-cn-i-73owjymdk6/7f21977a1dbf47a0935a06642a74dded~tplv-73owjymdk6-jj-mark-v1:0:0:0:0:5o6Y6YeR5oqA5pyv56S-5Yy6IEAgQ2VycmRh:q75.awebp?rk3s=f64ab15b&x-expires=1787107714&x-signature=LmKKx%2FuRXN8zMtN7m4EIYwBRLgs%3D)

本 Skill 与文中示例仅面向**依法公开**的网页信息采集与工程化实践分享。

使用前请确认：

1.  目标数据属于公开可获取范围，且用途合法合规
2.  遵守目标站点服务条款、robots 约定与当地法律法规
3.  **禁止**未授权访问、绕过登录/付费墙、高频压垮目标站、采集个人隐私或商业秘密
4.  生成与执行爬虫脚本的**合规责任由使用者自行承担**；作者不对滥用行为负责

若你的场景不确定是否合规，请先咨询法务，**不要**直接跑采集。

***

## 它解决什么

![juejin-crawl-pipeline.png](https://p3-xtjj-sign.byteimg.com/tos-cn-i-73owjymdk6/0eb8eb422ed940a2ae87a9e31bcef047~tplv-73owjymdk6-jj-mark-v1:0:0:0:0:5o6Y6YeR5oqA5pyv56S-5Yy6IEAgQ2VycmRh:q75.awebp?rk3s=f64ab15b&x-expires=1787107714&x-signature=Ag5kwZKiVMfhZzXMRmXhIVRksqc%3D)

| 痛点           | Skill 怎么压住                                        |
| ------------ | ------------------------------------------------- |
| 每个站手写一套      | 只读 `config.py`，按 id 生成 `script/{id}.py`           |
| 翻页写错成第 3 页   | 强制验证「脚本第 2 页 = 源站真实第 2 页」                         |
| 增量逻辑各写各的     | 统一查 `crawl_logs`，list 比 URL、data 比 (name,type)    |
| 附件下载乱七八糟     | 强制走 `utils.download` + `utils.attachment.process` |
| Agent 口头约定易丢 | 写进 `SKILL.md`，安装后自动可触发                            |
| 换业务就改提示词     | `constant.py` 配置主题/字段/类别，LLM 模板不用重写               |

Skill 干的事很明确：你给 Agent 一个（或一组）**config id**，它按配置的 `page_type`（`list` / `data`）分析站点、验证翻页、生成 scrapling 脚本、执行增量采集并入库。

默认抽取的是通用结构化条目（`name` / `code` / `type`），**不是**写死「企业许可」；企业安许、招投标等垂直场景只需改 `utils/constant.py`（仓库里有 domain 示例）。

```text
Task Progress:
- [ ] 解析 id，读取 config（只读）
- [ ] 按 page_type 分析结构并验证翻页
- [ ] 生成 script/{id}.py（含 crawl_url / check_pagination）
- [ ] 执行采集与增量
- [ ] 写入 SQLite（crawl_logs + records）
```

***

## list vs data：两条采集路径

![juejin-list-vs-data.png](https://p3-xtjj-sign.byteimg.com/tos-cn-i-73owjymdk6/7131aa65f7b44a7ebf1e67eb3a3a9341~tplv-73owjymdk6-jj-mark-v1:0:0:0:0:5o6Y6YeR5oqA5pyv56S-5Yy6IEAgQ2VycmRh:q75.awebp?rk3s=f64ab15b&x-expires=1787107714&x-signature=xrITYBTS5O1q1bsZDR1Y3b8oMJk%3D)

| page\_type | 入口 URL 含义 | 增量对比         | 入库方式                                  |
| ---------- | --------- | ------------ | ------------------------------------- |
| `list`     | 列表页       | 详情页完整 URL    | 进详情 → 正文+附件 → `txt_model` → `records` |
| `data`     | 数据页       | (name, type) | 当前页直接提取 → `records`                   |

全局开关（如 `PAGE_COUNT` / `MAX_EXTRA_PAGES` / `DETAIL_ENABLED`）在工具层统一管，脚本禁止硬编码覆盖；单配置也可覆盖 `page_count` / `max_extra_pages` / `page_size`。

id 支持组合写法，避免一次只跑一个站：

| 形式 | 示例        | 结果            |
| -- | --------- | ------------- |
| 单个 | `1`       | `[1]`         |
| 逗号 | `1,2,3`   | `[1,2,3]`     |
| 区间 | `1-5`     | `[1,2,3,4,5]` |
| 组合 | `1,3-5,8` | `[1,3,4,5,8]` |

***

## 怎么装：从 GitHub 到 Agent

![juejin-crawl-install.png](https://p3-xtjj-sign.byteimg.com/tos-cn-i-73owjymdk6/100b81754492440aab34dc6d0db49cbf~tplv-73owjymdk6-jj-mark-v1:0:0:0:0:5o6Y6YeR5oqA5pyv56S-5Yy6IEAgQ2VycmRh:q75.awebp?rk3s=f64ab15b&x-expires=1787107714&x-signature=e6sNFhlt6w%2BJqYC%2FrV7lnrUd0qw%3D)
skills.sh **没有单独「投稿审核」**。公开仓库 + 有人执行 `npx skills add`，遥测就会进入索引。

本仓库已支持**多 Skill 并列**（例如还有 `faker-mock-setup`），按需安装即可：

```bash
# 安装本 Skill
npx skills add Cerrda/skills --skill scrapling-config-crawl

# 全局
npx skills add Cerrda/skills --skill scrapling-config-crawl -g -y

# 看仓库里有哪些 skill
npx skills add Cerrda/skills --list
```

*   仓库：<https://github.com/Cerrda/skills>
*   技能页（索引后）：<https://skills.sh/cerrda/skills/scrapling-config-crawl>
*   生态入口：<https://skills.sh/>

目标业务项目需已具备配套工程（`config.py`、`utils.*`、scrapling、`uv` 虚拟环境等）。Skill 负责的是**采集流程与生成约束**，不是从零脚手架整个爬虫仓库。

***

## 对话里怎么用

对 Agent 直接说：

```text
按 id 1,3-5 生成并执行采集
```

或：

```text
用 scrapling-config-crawl 处理 config 里 id=2 的 list 站点
```

Agent 会：

1.  解析 id（找不到配置则报错跳过）
2.  **禁止改** `config.py`
3.  写爬虫前先读 scrapling 官方 Skill，代码必须用 scrapling
4.  遇验证码/空数据/翻页跳页等，**不得当成功收工**，必须继续排查

每个生成的 `script/{id}.py` 还要暴露可测 API：

```python
async def crawl_url(url: str) -> dict: ...
async def check_pagination(page_count) -> dict: ...
```

方便外部模块复用同一套正式采集逻辑，而不是另写一套「探测专用」简化版。

***

## 为什么值得做成 Skill（而不是 README）

| 痛点                      | Skill 带来的变化                     |
| ----------------------- | ------------------------------- |
| 翻页/附件规则每次口头教            | description 触发，整份流程进上下文         |
| 新人漏掉 `from_ocr` / 装饰图占位 | 硬性约束写进生成要求                      |
| 多站复制粘贴容易漂移              | 统一走 `utils.db` / `utils.paging` |
| 跨仓库同步 `.cursor/skills`  | `npx skills add` 一行同步           |

本质上，这是把「踩过坑的采集规范」打包成 **可版本化、可分发的 Agent 上下文**。

***

## 你可以立刻试的三件事

1.  `npx skills add Cerrda/skills --skill scrapling-config-crawl`
2.  在已有 `config.py` 的采集项目里，对 Agent 说：`采集 id=1`
3.  先跑 `check_pagination`，确认第 2 页 URL 与源站一致，再开正式增量

再次提醒：**只采依法公开数据，合规优先于速度。**

如果这套配置驱动采集流程对你有用，欢迎 Star 仓库；也欢迎在评论区聊聊你们团队怎么约束 Agent 写爬虫——我很好奇大家都把哪些「翻页坑」还埋在聊天记录里。

***
