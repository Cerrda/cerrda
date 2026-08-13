export const siteProfile = {
  name: 'Cerrda',
  role: '前端开发工程师',
  tagline: '把工程化直觉写进工具，把 Agent 工作流做成可安装 Skill',
  bio: '专注 Vue / Nuxt 工程化、开发者体验与 Agent Skill 设计。喜欢把重复的联调、类型同步与采集流程沉淀成可复用的基础设施。',
  location: 'China',
  email: 'cerrda.dev@outlook.com',
  links: {
    juejin: 'https://juejin.cn/user/2564487822453831/posts',
    github: 'https://github.com/Cerrda',
    skills: 'https://skills.sh/cerrda',
  },
}

export const contactChannels = [
  {
    id: 'email',
    label: '邮箱',
    value: siteProfile.email,
    href: `mailto:${siteProfile.email}`,
    hint: '合作与技术交流优先',
  },
  {
    id: 'github',
    label: 'GitHub',
    value: 'github.com/Cerrda',
    href: siteProfile.links.github,
    hint: '开源仓库与 Skills',
  },
  {
    id: 'juejin',
    label: '掘金',
    value: 'juejin.cn/user/2564487822453831',
    href: siteProfile.links.juejin,
    hint: '技术文章与实践笔记',
  },
  {
    id: 'skills',
    label: 'skills.sh',
    value: 'skills.sh/cerrda',
    href: siteProfile.links.skills,
    hint: '可安装 Agent Skill',
  },
] as const

export const morphingRoles = ['Frontend Engineer', 'Agent Skill Author', 'DX Tool Builder', 'Vue / Nuxt Craftsman']

export const navItems = [
  { id: 'about', label: '关于' },
  { id: 'projects', label: '项目' },
  { id: 'packages', label: '开源' },
  { id: 'skills', label: 'Skills' },
  { id: 'articles', label: '文章' },
  { id: 'timeline', label: '轨迹' },
]

export const projects = [
  {
    id: 'agent-workbench',
    title: 'Agent Workbench',
    subtitle: '面向前端联调的 Agent 工作台',
    description:
      '把 OpenAPI、页面级 Mock、Skill 编排与对话式任务流整合到同一工作台。强调可观测的 Agent 步骤、可回放的工具调用，以及前端工程师真正能落地的 DX。',
    stack: ['Nuxt 4', 'MSW', 'OpenAPI', 'Cursor Skills'],
    highlight: 'Agent × Frontend',
    placeholder: true,
  },
  {
    id: 'remote-dts-studio',
    title: 'Remote DTS Studio',
    subtitle: '远程组件类型可视化控制台',
    description:
      '围绕 vite-plugin-fetch-dts 构建的类型同步面板：扫描远程 Web Components 导入、热更新声明文件，并可视化模块 / 事件类型映射。',
    stack: ['Vite', 'TypeScript', 'Web Components'],
    highlight: 'Type System',
    placeholder: true,
  },
  {
    id: 'skill-forge',
    title: 'Skill Forge',
    subtitle: '可安装 Agent Skill 发布流水线',
    description:
      '从 SKILL.md、references、assets 模板到 skills.sh 索引的端到端发布体验。内置合规声明、触发描述调优与多 Skill 并列安装策略。',
    stack: ['Agent Skills', 'Node', 'GitHub'],
    highlight: 'Agent Infra',
    placeholder: true,
  },
  {
    id: 'directive-kit',
    title: 'Vue Directive Kit',
    subtitle: '中后台指令工具箱',
    description:
      '沉淀 v-ellipsis-tooltip、v-copy、溢出检测与虚拟 Tooltip 模式。目标是用指令消灭成百上千个无用组件实例，兼顾性能与 API 一致性。',
    stack: ['Vue 3', 'Element Plus', 'VueUse'],
    highlight: 'Performance',
    placeholder: true,
  },
  {
    id: 'nuxt-portfolio-kit',
    title: 'Nuxt Motion Portfolio Kit',
    subtitle: '本站同源的可部署模板',
    description:
      'Nuxt 静态站 + Inspira UI + 双主题 + GitHub Pages 流水线。适合作为个人主页 / 在线简历的起点，强调动效预算与内容结构。',
    stack: ['Nuxt', 'Inspira UI', 'Tailwind v4'],
    highlight: 'Design System',
    placeholder: true,
  },
  {
    id: 'crawl-ops',
    title: 'Crawl Ops Console',
    subtitle: '配置驱动采集运维台',
    description:
      '配合 scrapling-config-crawl：按 config id 管理 list/data 路径、翻页校验、增量入库与附件分流。把「会写爬虫」升级成「可复用的采集规范」。',
    stack: ['Python', 'Scrapling', 'SQLite'],
    highlight: 'Data Agent',
    placeholder: true,
  },
]

export const packages = [
  {
    name: 'vite-plugin-fetch-dts',
    role: '作者',
    href: 'https://npmx.dev/package/vite-plugin-fetch-dts',
    npm: 'https://www.npmjs.com/package/vite-plugin-fetch-dts',
    version: '0.7.0',
    summary: '自动获取远程 Vue / Web Components 类型声明的 Vite 插件。',
    points: [
      '扫描远程 import，并行拉取类型并生成全局组件声明',
      '支持热更新、source map、多正则匹配与 Web Components 事件转换',
      '让微前端 / CDN 组件在本地获得完整 TypeScript 体验',
    ],
  },
  {
    name: 'openapi-v3-request-generator',
    role: '贡献者',
    href: 'https://npmx.dev/package/openapi-v3-request-generator',
    npm: 'https://www.npmjs.com/package/openapi-v3-request-generator',
    version: '4.0.2',
    summary: '基于 OpenAPI v3 的请求代码生成器，支持高度自定义钩子。',
    points: [
      'ts/js 双模式、多项目文档、include/exclude 与 mock 生成',
      'onGenRequestFnHook 定制请求函数形态',
      'sourceMap + CLI 查找，降低大型 API 面维护成本',
    ],
  },
]

export const skills = [
  {
    name: 'faker-mock-setup',
    href: 'https://skills.sh/cerrda/skills/faker-mock-setup',
    install: 'npx skills add https://github.com/cerrda/skills --skill faker-mock-setup',
    summary: '按 OpenAPI / 函数名生成页面级 Faker overrideResponse Mock。',
    points: ['函数名或 URL → ApiId', '生成 setup{ApiId}MockHandler', 'Vue / Vite + MSW 联调'],
  },
  {
    name: 'scrapling-config-crawl',
    href: 'https://skills.sh/cerrda/skills/scrapling-config-crawl',
    install: 'npx skills add https://github.com/cerrda/skills --skill scrapling-config-crawl',
    summary: '按 config.py id 生成 scrapling 采集脚本并写入 SQLite。',
    points: ['list / data 增量与附件分流', '强制复用项目 utils.*', '仅面向依法公开数据'],
  },
]

export const careerTimeline = [
  {
    title: '2026',
    content:
      '把团队 Mock 与配置驱动采集沉淀为可安装 Agent Skill，并上架 skills.sh。持续探索「前端工程化 × Agent」交叉地带。',
  },
  {
    title: '2025',
    content:
      '深耕 Vue 指令与 UnoCSS 图标工具链：溢出 Tooltip、复制反馈、SVG 热更新。发布 / 维护 vite-plugin-fetch-dts。',
  },
  {
    title: '工程主题',
    content: '类型系统、开发者体验、中后台性能、可复用 Agent 上下文。相信好的抽象应该既对人对 Agent 都友好。',
  },
]

export const articleMeta = [
  {
    slug: 'scrapling-config-crawl-skill',
    id: '7672698563611197490',
    title: '把配置驱动爬虫做成可安装 Skill：scrapling-config-crawl',
    description: '按 config.py 的 id 生成 scrapling 脚本并写入 SQLite，把翻页校验与增量采集固化成 Agent Skill。',
    date: '2026-08-12',
    tags: ['爬虫', 'Agent Skill'],
  },
  {
    slug: 'faker-mock-setup-skill',
    id: '7672434949261197352',
    title: '把团队 Mock 工作流做成可安装 Skill：faker-mock-setup 上架 skills.sh 实践',
    description: '把「按 OpenAPI 生成页面级 Faker Mock」固化为可安装 Skill，改善前端联调体验。',
    date: '2026-08-11',
    tags: ['AI编程', 'Cursor'],
  },
  {
    slug: 'unocss-svg-hmr',
    id: '7653373167660204078',
    title: '开发体验升级：UnoCSS 自定义 SVG 图标热更新方案',
    description: '用 chokidar + @iconify/tools + configDeps 实现图标热更新，无需重启开发服务器。',
    date: '2026-07-01',
    tags: ['架构', '前端框架'],
  },
  {
    slug: 'vue3-vcopy',
    id: '7650080459327373354',
    title: '一行指令搞定复制：Vue 3 vCopy 实现解析',
    description: '基于 VueUse useClipboard 与 Element Plus 虚拟 Tooltip 的复制指令实现。',
    date: '2026-06-01',
    tags: ['前端', '代码规范'],
  },
  {
    slug: 'unocss-icons',
    id: '7650093760348848147',
    title: '从 uno.config.ts 看懂 UnoCSS 图标方案',
    description: 'presetIcons 与 Iconify 工具链：本地 SVG 到原子类与 VS Code 补全。',
    date: '2026-06-01',
    tags: ['前端', '代码规范'],
  },
  {
    slug: 'tooltip-perf',
    id: '7637342611919880228',
    title: '性能提升 satisfying！一个 Vue3 指令干掉页面上 200 个无用 Tooltip 实例',
    description: '按需创建虚拟 Tooltip，消灭中后台表格中的无效 Tooltip 实例。',
    date: '2026-05-01',
    tags: ['设计', '前端'],
  },
  {
    slug: 'v-ellipsis-tooltip',
    id: '7597704040216215578',
    title: '一行代码解决文本溢出提示：Vue 3 + Element Plus 打造智能 v-ellipsis-tooltip 指令',
    description: '仅在文本真正溢出时展示 Tooltip 的自定义指令。',
    date: '2026-02-01',
    tags: ['前端', 'Vue.js'],
  },
  {
    slug: 'uniapp-nav-bar',
    id: '7576843726010662938',
    title: 'uni-app 自适应透明导航栏组件',
    description: '支持滚动渐变透明的现代导航栏交互体验。',
    date: '2025-12-01',
    tags: ['uni-app'],
  },
  {
    slug: 'fnm-windows',
    id: '7576276707330981894',
    title: 'Windows 系统中使用 fnm 自动管理 node 版本',
    description: '打开项目时自动切换到项目所需的 Node 版本。',
    date: '2025-12-01',
    tags: ['前端'],
  },
]
