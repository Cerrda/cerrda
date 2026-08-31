import articleMeta from './articles.json'
import packages from './packages.json'
import skills from './skills.json'

export { articleMeta, packages, skills }

export const siteProfile = {
  name: 'Cerrda',
  role: '前端工程师 · Agent Skill',
  tagline: '把工程判断写成可分发工具，把 Agent 工作流做成可版本化 Skill',
  bio: '专注 Vue / Nuxt 工程化、开发者体验与 Agent Skill。将联调、类型同步与采集等重复流程，抽象为可复用、可安装的基础设施。',
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
    hint: '合作与深度技术交流',
  },
  {
    id: 'github',
    label: 'GitHub',
    value: 'github.com/Cerrda',
    href: siteProfile.links.github,
    hint: '开源仓库与可安装 Skill',
  },
  {
    id: 'juejin',
    label: '掘金',
    value: 'juejin.cn/user/2564487822453831',
    href: siteProfile.links.juejin,
    hint: '工程实践与技术写作',
  },
  {
    id: 'skills',
    label: 'skills.sh',
    value: 'skills.sh/cerrda',
    href: siteProfile.links.skills,
    hint: '可安装 Agent Skill',
  },
] as const

export const morphingRoles = ['Frontend Engineer', 'Agent Skill Author', 'DX Infrastructure', 'Vue / Nuxt Engineer']

export const navItems = [
  { id: 'about', label: '关于' },
  { id: 'packages', label: '开源' },
  { id: 'skills', label: 'Skills' },
  { id: 'articles', label: '文章' },
  { id: 'timeline', label: '轨迹' },
]

export const careerTimeline = [
  {
    title: '2026',
    headline: 'Agent 基础设施',
    content:
      '将 Mock 联调与配置驱动采集封装为可版本化 Skill，并上架 skills.sh。把前端工程里反复出现的判断，写成 Agent 可执行的约束、流程与边界。',
  },
  {
    title: '2025',
    headline: '类型系统与工具链',
    content:
      '完成 Vue 指令体系与 UnoCSS 图标工具链的系统化抽象。发布并维护 vite-plugin-fetch-dts，让远程 Vue / Web Components 在本地获得完整 TypeScript 体验。',
  },
  {
    title: '2024',
    headline: '面向人与 Agent 的抽象',
    content:
      '以类型系统、开发者体验与中后台性能为轴，开始设计同时面向人与 Agent 的上下文——可复用的抽象，应当两边都读得懂。',
  },
  {
    title: '2023',
    headline: '可复用的交互原语',
    content: '在 Vue 3 中后台交付中，将溢出提示、复制、导航等高频交互抽成指令与组件，建立第一层可复用的交互语言。',
  },
]
