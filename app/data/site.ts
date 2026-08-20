import articleMeta from './articles.json'
import packages from './packages.json'
import skills from './skills.json'

export { articleMeta, packages, skills }

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

