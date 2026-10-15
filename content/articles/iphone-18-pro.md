---
title: "她喜欢 iPhone 18 Pro 勃艮第红，我做了同款情侣点餐小程序"
description: "用 Vue 3、uni-app 和 uniCloud 做了只给两人用的微信点餐小程序 EatEat，颜色跟勃艮第红走同一套。"
date: 2026-10-13
tags: ["uni-app", "Vue.js"]
juejin: https://juejin.cn/post/7695972603000815635
slug: iphone-18-pro
---

# 她说喜欢iphone 18 pro 勃艮第红，我直接下单并附赠一个同款情侣点餐小程序。

她说喜欢 iPhone 18 Pro 勃艮第红。我直接下了单。盒子还在路上的时候，我把同一种红做成了一间厨房：只给两个人用的微信小程序，一个人做饭，一个人点餐。

它叫 EatEat。没有支付，没有配送，没有陌生人，也没有推荐流。界面上的话像贴在冰箱上的纸条，写「早上」「这一餐」「记下」，不写「用户」和「履约」。

完整界面在 Pencil 里：[EatEat 设计稿](https://app.pen.dev/s/CTmaggYbSW84Htz7g7M9ClVp5TvDQIpqz0vaoSDf6Ss)。代码在 GitHub：[Cerrda/eat-eat](https://github.com/Cerrda/eat-eat)。

## 先选一边

打开之后先认人。认的是当前微信，不另做账号，不绑手机号。还没有厨房时，只问一件事：你来做饭，还是你来点餐。

![role.png](https://p6-xtjj-sign.byteimg.com/tos-cn-i-73owjymdk6/9b84e9e104ab4fff8bfea4cbf52bdbaf~tplv-73owjymdk6-jj-mark-v1:0:0:0:0:5o6Y6YeR5oqA5pyv56S-5Yy6IEAgQ2VycmRh:q75.awebp?rk3s=f64ab15b&x-expires=1792484344&x-signature=lB9u0KsgIc88qq74WWI4bJVAMqQ%3D)

选定之后生成一间待加入的厨房。邀请页给出 6 位邀请码，主按钮是转发给微信好友。码 48 小时有效，换一个新码，旧码和已经发出的卡片一起失效。对方点开卡片，角色自动取互补的那一边。

![invite.png](https://p6-xtjj-sign.byteimg.com/tos-cn-i-73owjymdk6/ba1cf46968fa492e97306261647602b8~tplv-73owjymdk6-jj-mark-v1:0:0:0:0:5o6Y6YeR5oqA5pyv56S-5Yy6IEAgQ2VycmRh:q75.awebp?rk3s=f64ab15b&x-expires=1792484344&x-signature=Q5tsVV3utqvCEsOlr9QA9Cu%2BQgA%3D)

一个厨房里固定一个做饭的人（Cooker）和一个点餐的人（Eater）。称呼默认是「厨神」和「食神」，设置里可以改成 2 到 8 个字。

## 菜单

点餐的人看到的是已经上架的菜。只能点今天、明天、后天，餐次只有早上、中午、晚上。一笔订单是某一天的某一个餐次，里面 1 到 6 道菜。

![menu.png](https://p6-xtjj-sign.byteimg.com/tos-cn-i-73owjymdk6/9f4e82d37bb7428abc1a17c46e2ea26f~tplv-73owjymdk6-jj-mark-v1:0:0:0:0:5o6Y6YeR5oqA5pyv56S-5Yy6IEAgQ2VycmRh:q75.awebp?rk3s=f64ab15b&x-expires=1792484344&x-signature=oBDxomoh7v3d1AAiDgixP7TsODM%3D)

菜单顶上是日期和早中晚。搜菜名，按家常、汤羹、面食筛。不想选的时候，可以让它随便留几道，其余继续随机。选好的菜停在底部，再去确认。

![roll.png](https://p6-xtjj-sign.byteimg.com/tos-cn-i-73owjymdk6/6578182e3661414d865c426b1ce2efc2~tplv-73owjymdk6-jj-mark-v1:0:0:0:0:5o6Y6YeR5oqA5pyv56S-5Yy6IEAgQ2VycmRh:q75.awebp?rk3s=f64ab15b&x-expires=1792484344&x-signature=sbTdrwV%2BxGVskGAbOLKCLAH%2Fjr0%3D)

点出去之后进入待接单。做饭的人可以接，也可以拒绝。拒绝必须留一句话。

## 做饭的这一边

做饭的人首页是待做，按用餐时间排。接单或拒绝都在这张纸条上。做过的那一餐不在待做里划掉，要另外记下来。

![todo.png](https://p6-xtjj-sign.byteimg.com/tos-cn-i-73owjymdk6/f9e2ca5262424d718585b2753ae36504~tplv-73owjymdk6-jj-mark-v1:0:0:0:0:5o6Y6YeR5oqA5pyv56S-5Yy6IEAgQ2VycmRh:q75.awebp?rk3s=f64ab15b&x-expires=1792484344&x-signature=MNKZ4nATxFIeojgtEatX7%2FM3P9Y%3D)

菜由做饭的人自己写。没有封面不能上架，封面从相册选，或当场拍。没上架的菜，点餐端看不见。

![dishes.png](https://p6-xtjj-sign.byteimg.com/tos-cn-i-73owjymdk6/7212829486e5454c92ea0bf7af341ee5~tplv-73owjymdk6-jj-mark-v1:0:0:0:0:5o6Y6YeR5oqA5pyv56S-5Yy6IEAgQ2VycmRh:q75.awebp?rk3s=f64ab15b&x-expires=1792484344&x-signature=jNo3Q3IohSekATLmRPiwH1nTbi4%3D)

做完之后记一笔。照片和一句话，两边看到的是同一条时间线。点餐的人可以翻，不能改，也不能删。

![journal.png](https://p6-xtjj-sign.byteimg.com/tos-cn-i-73owjymdk6/30122461e16d4220a8cbe52831856b87~tplv-73owjymdk6-jj-mark-v1:0:0:0:0:5o6Y6YeR5oqA5pyv56S-5Yy6IEAgQ2VycmRh:q75.awebp?rk3s=f64ab15b&x-expires=1792484344&x-signature=v4dXdZMwVwbro1wslFaCAVcHWk8%3D)

## 仓库里实际在用的技术栈

项目从 Vitesse uni-app 长出来，目标平台是微信小程序 `mp-weixin`。页面跑在微信开发者工具里。

| 层  | 用什么                                                 |
| -- | --------------------------------------------------- |
| 界面 | Vue 3.4、`<script setup>`、TypeScript                 |
| 框架 | uni-app 3，`@dcloudio/uni-mp-weixin`                 |
| 构建 | Vite 5、pnpm、`@uni-helper/unh`                       |
| 样式 | UnoCSS 66，`@uni-helper/unocss-preset-uni`，尺寸用 `rpx` |
| 工程 | 文件路由、布局、组件自动注册、`unplugin-auto-import`               |
| 质量 | ESLint 9、vue-tsc、Vitest                             |
| 字体 | 马善政、霞鹜文楷、龙藏，纸色底 `#FBF3EA`                           |
| 上传 | `uni-mini-ci`，脚本里先构建再传微信                            |

目录大致是这样：

```text
src/                      小程序
  pages/                  绑定、点餐、做饭
  components/             菜单、待做、订单、纸页、底栏
  api/                    云对象的类型和调用
  composables/            分页、顶部安全区
  utils/                  账号、草稿、角标、云文件
uniCloud-alipay/          阿里云 uniCloud
  cloudfunctions/eat/     云对象
  database/               表结构和索引
design/design.pen         Pencil 设计稿
.agents/skills/           给代理用的 skills
.cursor/mcp.json          本机接上的 MCP
```

页面样式写在 `class` 上。`<style>` 里只留原子类写不了的部分：`@font-face`、`page`，以及必须具名的 `hover-class`。文本一律用 `textarea`。微信小程序里给 `input` 设的字体会作用不到已经输入的字，单行也收成一行高的 `textarea`。

状态放在页面和 composable 里。`src/composables/usePaged.ts` 管列表分页，`src/utils/tabs.ts` 管做饭端和点餐端两套底栏。

## Skills

`.agents/skills` 是代理动手时要读的说明书，锁在 `skills-lock.json` 里。按来源分成三组。

**uni-helper 的工程技能**，对应小程序怎么写：

*   `vue`、`vue-best-practices`：Composition API 和 Vue 3 的写法
*   `uni-app`、`uni-helper`：跨端框架，以及 pages、layouts、manifest、组件自动注册
*   `vite`、`unocss`：构建和原子类
*   `vueuse-functions`：组合式工具
*   `pinia`：状态库参考。这份 skill 已装进仓库，这版页面状态仍写在 composable 里

**微信开发者工具**，入口是 `wechatide-skill`，下面再分场景：

| 子技能                  | 负责                               |
| -------------------- | -------------------------------- |
| `installer`          | 检查、下载、更新开发者工具                    |
| `initializer`        | 打开项目窗口、登录、读 AppID                |
| `project-manager`    | 已导入项目列表                          |
| `project-config`     | `project.config.json`，例如域名校验、热重载 |
| `compiler`           | 编译、打开指定页、构建 npm、刷新模拟器            |
| `automator`          | 点击、输入、滚动、断言                      |
| `debugger`           | console、network、截图、清缓存           |
| `previewer`          | 预览二维码、上传体验版                      |
| `cloudbase-operator` | 云环境、云函数、云数据库、云存储                 |

**设计口味**，来自 taste-skill 和 motion-design，用来把这间厨房定成纸面和勃艮第红：

*   `minimalist-ui`、`high-end-visual-design`、`design-taste-frontend`
*   `imagegen-frontend-mobile`、`image-to-code`、`brandkit`
*   `motion-design`
*   同目录里还有 `design-taste-frontend-v1`、`gpt-taste`、`industrial-brutalist-ui`、`redesign-existing-projects`、`full-output-enforcement`，作为备用口味和输出约束

会改到页面上能看见的东西时，先改 `design/design.pen`，确认之后再写 `src` 里的页面。

## MCP

`.cursor/mcp.json` 接了三个服务，和上面的 skills 对得上。

| MCP               | 命令              | 在这个项目里做什么                                   |
| ----------------- | --------------- | ------------------------------------------- |
| `pencil`          | pen.dev 桌面端     | 读写 `design/design.pen`。设计稿是加密的，只通过这个 MCP 打开 |
| `wechat-devtools` | `wechatide mcp` | 编译、模拟器、自动化、console、截图、预览上传                  |
| `uni-doc`         | `uni-mcp`       | 查 uni-app 官方文档                              |

看页面、点按钮、对截图，走微信开发者工具，不把 H5 开发服务器当成验收结果。设计稿的地址是：

<https://app.pen.dev/s/CTmaggYbSW84Htz7g7M9ClVp5TvDQIpqz0vaoSDf6Ss>

上面的菜单、随便点、邀请、待做、菜品和记下这餐，都是从这份稿子里截出来的。

## 后端是 uniCloud

服务端在 `uniCloud-alipay`，用的是阿里云。一个云对象 `eat`，运行时 Node.js 18，入口 `cloudfunctions/eat/index.obj.js`。前端通过 `uniCloud.importObject('eat')` 调用，类型收在 `src/api/eat.ts`。

云对象把绑定、菜单、订单和记录收成一组方法，例如 `createInvite`、`acceptInvite`、`listMenu`、`createOrder`、`acceptOrder`、`rejectOrder`、`createRecord`。每个方法先认当前会话，再进 `lib/service.js`。数据库读写在 `lib/store.js`，微信登录用 `lib/wx.js` 拿 code 换身份。

表跟厨房走，客户端 schema 的读写权限是关的，数据只从云对象进出：

| 集合                              | 放什么                |
| ------------------------------- | ------------------ |
| `eat-users` / `eat-sessions`    | 微信身份和当前登录          |
| `eat-kitchens`                  | 这一对人的厨房            |
| `eat-invites`                   | 6 位邀请码             |
| `eat-categories` / `eat-dishes` | 分类和菜，含封面、用料、步骤、上下架 |
| `eat-orders`                    | 某一天某一个餐次的点餐        |
| `eat-records`                   | 做过的那一餐，照片和文字       |

订单提交、记录发布时会复制当时的菜名和封面。之后改菜、下架、删除，已经记下的那一餐保持原样。

## 开源

仓库公开在：

<https://github.com/Cerrda/eat-eat>

协议是 MIT。本地开发是 `pnpm dev`，检查用 `pnpm type-check`、`pnpm lint` 和 `pnpm test`。上传微信体验版走 `pnpm upload:mp-weixin`。

手机到了是勃艮第红。小程序里的按钮也是这一种红。她打开菜单，点后天早上的两道菜，我在待做里接单。
