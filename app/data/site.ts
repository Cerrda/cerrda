import articleMeta from './articles.json'
import packages from './packages.json'
import skills from './skills.json'

export { articleMeta, packages, skills }

export const siteProfile = {
  name: 'Cerrda',
  role: '前端工程师 · Agent 基础设施',
  tagline: '发布 Vite 插件与可安装 Agent Skill。把类型同步、Mock 联调和采集流程做成可复用的工程基础设施。',
  bio: 'Vue / Nuxt 方向前端工程师，工作重心在工程化、开发者体验与 Agent 工作流。已发布 vite-plugin-fetch-dts 等 npm 包，并在 skills.sh 上架可安装 Skill，把远程类型同步、Mock 联调与配置驱动采集固化为可版本化工具。',
  location: 'China',
  email: 'cerrda728@gmail.com',
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
    hint: '项目合作与深度技术交流',
  },
  {
    id: 'github',
    label: 'GitHub',
    value: 'github.com/Cerrda',
    href: siteProfile.links.github,
    hint: '开源仓库、Vite 插件与 Skill',
  },
  {
    id: 'juejin',
    label: '掘金',
    value: 'juejin.cn/user/2564487822453831',
    href: siteProfile.links.juejin,
    hint: '工程实践与工具设计记录',
  },
  {
    id: 'skills',
    label: 'skills.sh',
    value: 'skills.sh/cerrda',
    href: siteProfile.links.skills,
    hint: '已上架的可安装 Agent Skill',
  },
] as const

export const morphingRoles = ['Frontend Engineer', 'Agent Infrastructure', 'Open Source Author', 'Vue / Nuxt Engineer']

export const navItems = [
  { id: 'about', label: '关于' },
  { id: 'packages', label: '开源' },
  { id: 'skills', label: 'SKILLS' },
  { id: 'articles', label: '文章' },
  { id: 'timeline', label: '轨迹' },
] as const

export type NavSectionId = (typeof navItems)[number]['id']

export const navSectionPaths = navItems.map((item) => `/${item.id}`)

export function navSectionFromPath(path: string): NavSectionId | null {
  const id = path.replace(/^\/+|\/+$/g, '')
  return navItems.some((item) => item.id === id) ? (id as NavSectionId) : null
}

export const careerTimeline = [
  {
    title: '2026',
    headline: 'Agent 工作流上架 skills.sh',
    content:
      '发布 faker-mock-setup 与 scrapling-config-crawl，把团队 Mock 联调与配置驱动采集封装为可安装 Skill。将触发条件、硬性规则、模板与合规边界写成 Agent 可执行、可版本化的工作流。',
  },
  {
    title: '2025',
    headline: '类型系统与工程工具链',
    content:
      '发布并维护 vite-plugin-fetch-dts，在 Vite 构建期为远程 Vue / Web Components 补齐完整 TypeScript 体验。同时把 Vue 指令体系与 UnoCSS 图标热更新做成可复用工具链。',
  },
  {
    title: '2024',
    headline: '同时面向人与 Agent 的抽象',
    content:
      '以类型系统、开发者体验与中后台性能为轴，开始把可复用能力同时写成给人读的工具，以及给 Agent 执行的上下文。',
  },
  {
    title: '2023',
    headline: '中后台交互原语',
    content:
      '在 Vue 3 中后台交付中，将溢出提示、一键复制、自适应导航等高频交互抽成指令与组件。按需创建 Tooltip，拿掉表格页里成批无效实例，形成第一层可复用的交互语言。',
  },
]
