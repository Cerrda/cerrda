import tailwindcss from '@tailwindcss/vite'
import articles from './app/data/articles.json'
import { faviconBootScript, themeClassBootScript } from './app/data/favicon'
import { navSectionPaths } from './app/data/site'
import { withAppBase } from './app/utils/withAppBase'

const baseURL = process.env.NUXT_APP_BASE_URL || '/'

export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  future: {
    compatibilityVersion: 4,
  },
  modules: ['@nuxtjs/color-mode'],
  css: ['~/assets/css/main.css'],
  components: [
    {
      path: '~/components',
      pathPrefix: false,
      ignore: ['**/infinite-grid/**', '**/light-speed/**', '**/*.ts', '**/index.ts'],
    },
  ],
  colorMode: {
    classSuffix: '',
    preference: 'dark',
    fallback: 'dark',
    storageKey: 'cerrda-color-mode',
  },
  app: {
    baseURL,
    head: {
      title: 'Cerrda — Frontend & Agent Engineer',
      htmlAttrs: {
        'lang': 'zh-CN',
        'style': 'color-scheme:dark;background-color:#1a1520',
        'data-overlayscrollbars-initialize': '',
      },
      bodyAttrs: {
        'style': 'background-color:#1a1520',
        'data-overlayscrollbars-initialize': '',
      },
      meta: [
        { key: 'color-scheme', name: 'color-scheme', content: 'dark', tagPriority: 'critical' },
        {
          name: 'description',
          content: '前端工程师 Cerrda：Vue / Nuxt 工程化、Agent Skill 与开源工具链。把重复摩擦沉淀为可安装的基础设施。',
        },
        { key: 'theme-color', name: 'theme-color', content: '#1a1520' },
      ],
      script: [
        {
          key: 'cerrda-theme-class',
          innerHTML: themeClassBootScript(),
          tagPosition: 'head',
          tagPriority: 'critical',
        },
        {
          key: 'cerrda-favicon',
          innerHTML: faviconBootScript(baseURL),
          tagPosition: 'head',
          tagPriority: 'critical',
        },
      ],
      link: [
        {
          key: 'apple-touch-icon',
          rel: 'apple-touch-icon',
          sizes: '180x180',
          href: withAppBase('/apple-touch-icon.png', baseURL),
        },
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: 'anonymous' },
        {
          key: 'cerrda-fonts',
          rel: 'stylesheet',
          href: 'https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600;9..144,700&family=Sora:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap',
          media: 'print',
          onload: 'this.media="all"',
        },
        { rel: 'preload', href: withAppBase('/editorial/sheer-descent-subject.png', baseURL), as: 'image' },
      ],
    },
  },
  vite: {
    plugins: [tailwindcss()],
    optimizeDeps: {
      include: ['@chenglou/pretext', '@chenglou/pretext/rich-inline'],
    },
  },
  nitro: {
    preset: 'static',
    prerender: {
      crawlLinks: true,
      routes: ['/', ...navSectionPaths, ...articles.map((article) => `/articles/${article.slug}`)],
    },
  },
  routeRules: {
    '/': { prerender: true },
    ...Object.fromEntries(navSectionPaths.map((path) => [path, { prerender: true }])),
    '/articles/**': { prerender: true },
  },
})
