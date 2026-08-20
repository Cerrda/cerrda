---
title: "把团队 Mock 工作流做成可安装 Skill：faker-mock-setup 上架 skills.sh 实践"
description: "把「按 OpenAPI 生成页面级 Faker Mock」固化为可安装 Skill，改善前端联调体验。"
date: 2026-08-11
tags: ["AI编程","Cursor"]
juejin: https://juejin.cn/post/7672434949261197352
slug: faker-mock-setup-skill
---

# 把团队 Mock 工作流做成可安装 Skill：faker-mock-setup 上架 skills.sh 实践

> 仓库：[Cerrda/skills](https://github.com/Cerrda/skills)\
> 安装：`npx skills add Cerrda/skills --skill faker-mock-setup`

前端联调时，最烦的不是写页面，而是：**接口没好、字段语义乱、枚举靠猜、列表条数对不上 UI**。\
我们把「按 OpenAPI 生成页面级 Faker Mock」固化成一个 Agent Skill，并推到了 [skills.sh](https://skills.sh/) 生态——任何人用一行命令就能装。

***

## 先看一张图：它解决什么

![默认 Mock vs 自定义 Faker Mock](https://p6-xtjj-sign.byteimg.com/tos-cn-i-73owjymdk6/afe5550cfbec4893b590ef302f9320c2~tplv-73owjymdk6-jj-mark-v1:0:0:0:0:5o6Y6YeR5oqA5pyv56S-5Yy6IEAgQ2VycmRh:q75.awebp?rk3s=f64ab15b&x-expires=1787645907&x-signature=Zz4BUdswByoqO9PuT%2Blu%2FWld4I0%3D)

|      | 默认 Mock（gen 出来的） | 自定义 Faker Mock（本 Skill）             |
| ---- | ---------------- | ----------------------------------- |
| 数据来源 | 按字段**类型**自动造数    | 按字段**语义** + 中文 locale               |
| 适合场景 | 快速通结构 / 分页壳子     | 复杂列表、枚举、金额、中文文案                     |
| 维护方式 | `*.mock.ts` 生成物  | 页面目录 `mock.ts` + `overrideResponse` |

Skill 干的事很明确：你丢给 Agent 一个 **API 函数名** 或 **URL**，它在当前页面 `mock.ts` 里生成：

```ts
export const setupXxxMockHandler = async () => {
  if (!import.meta.env.DEV) return
  await setupMockHandler(
    XxxMockHandler({
      overrideResponse: {
        /* faker 语义化数据 */
      },
    }),
  )
}
```

***

## 架构直觉：MSW + Faker + OpenAPI

![MSW 拦截与 Faker 造数转存失败，建议直接上传图片文件](https://p6-xtjj-sign.byteimg.com/tos-cn-i-73owjymdk6/5ced91e4343f456ba7410a8cd7de729b~tplv-73owjymdk6-jj-mark-v1:0:0:0:0:5o6Y6YeR5oqA5pyv56S-5Yy6IEAgQ2VycmRh:q75.awebp?rk3s=f64ab15b&x-expires=1787645907&x-signature=cqX4%2Ft4hkj8k1m5RvtGalMEvNqM%3D)
链路可以记成三步：

1.  **OpenAPI gen**：`mock: true` 时产出 `*.mock.ts`（`{ApiId}MockHandler`）
2.  **页面 override**：Skill 用 `@faker-js/faker/locale/zh_CN` 写 `overrideResponse`
3.  **MSW 仅 DEV**：`setupMockHandler` 注册拦截，生产构建不进线上

注释里的枚举也会被约束，例如：

```text
案件状态 1已结案 2未结案  →  pickEnum([1, 2])
```

而不是随便 `faker.number.int()` 出一个 UI 永远对不上的状态码。

***

## 怎么装：从 GitHub 到 Agent

![安装链路：GitHub → skills CLI → Agent](https://p6-xtjj-sign.byteimg.com/tos-cn-i-73owjymdk6/0cc2f3e2e7e44723bab18f13a835625f~tplv-73owjymdk6-jj-mark-v1:0:0:0:0:5o6Y6YeR5oqA5pyv56S-5Yy6IEAgQ2VycmRh:q75.awebp?rk3s=f64ab15b&x-expires=1787645907&x-signature=40y0cqha4QjFWIZlkw%2FuYSOQrtc%3D)
skills.sh **没有单独「投稿审核」**。公开仓库 + 有人执行 `npx skills add`，遥测就会进入索引。

```bash
# 安装本 Skill（Cursor 等 Agent 可用）
npx skills add Cerrda/skills --skill faker-mock-setup

# 全局
npx skills add Cerrda/skills --skill faker-mock-setup -g -y

# 看仓库里有哪些 skill
npx skills add Cerrda/skills --list
```

*   仓库：<https://github.com/Cerrda/skills>
*   技能页（索引后）：<https://skills.sh/cerrda/skills/faker-mock-setup>
*   生态入口：<https://skills.sh/>

***

## 对话里怎么用

对 Agent 直接说：

```text
为 MonitorcaseGetMonitorCaseListPost 生成 mock
```

或丢 URL：

```text
/java-legalwatch-cloud/monitorcase/getMonitorCaseList
随机 1～10，9:1
```

没写配置时，Skill 会用 **AskQuestion** 让你选：

*   数组长度：固定 20 / 随机 1～10 …
*   可选字段：是否按 4:1、9:1 生成 `undefined`

然后同一会话内写入 `mock.ts`，并带上 DEV 守卫：

```ts
if (!import.meta.env.DEV) {
  return
}
```

启用方式二选一：

```ts
// A. 调接口前
await setupMonitorcaseGetMonitorCaseListPostMockHandler()

// B. useRequest
useRequest(fn, initial, {
  setupMockHandler: setupMonitorcaseGetMonitorCaseListPostMockHandler,
})
```

***

## 存量项目怎么接到这套管线

若项目还没接 MSW，Skill 包里带了模板（`assets/`）：

*   `mock.ts` → `src/utils/mock.ts`
*   `use-request.ts` → 按需复制
*   文档：`references/project-setup.md`

关键依赖与步骤摘要：

1.  安装 `@faker-js/faker`、`msw`、生成器
2.  `npx msw init ./public --save`
3.  `openapi.config.json5` 对应项目加 `"mock": true`，再 `pnpm gen`
4.  build 末尾删掉 `mock-service-worker.js`，避免误上生产
5.  安装 Skill，开始生成页面级 mock

***

## 为什么值得做成 Skill（而不是 README）

| 痛点                     | Skill 带来的变化               |
| ---------------------- | ------------------------- |
| 每次口头教 Agent 规则         | description 触发，自动加载完整流程   |
| 枚举 / DEV 守卫容易漏         | 写进硬性约束与去重逻辑               |
| 团队新人不会造中文 mock         | zh\_CN locale + 字段语义约定可复用 |
| 跨仓库复制 `.cursor/skills` | `npx skills add` 一行同步     |

本质上，这是把「团队部落知识」打包成 **可版本化、可分发的 Agent 上下文**。

***

## 你可以立刻试的三件事

1.  `npx skills add Cerrda/skills --skill faker-mock-setup`
2.  在任意带 OpenAPI mock 的页面，把一个接口名丢给 Agent
3.  打开 Network，确认 DEV 下请求被 MSW 接住（可用筛选 `-is:service-worker-initiated`）

如果这套流程对你有用，欢迎 Star 仓库，也欢迎在评论区聊聊你们团队的 Mock 约定——我很好奇大家都把哪些「口头规范」还埋在聊天记录里。

***
