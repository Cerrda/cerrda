import tailwindcss from '@tailwindcss/vite'
import { faviconBootScript } from './app/data/favicon'

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
        'data-overlayscrollbars-initialize': '',
      },
      bodyAttrs: {
        'data-overlayscrollbars-initialize': '',
      },
      meta: [
        {
          name: 'description',
          content: '前端开发工程师 Cerrda 的个人主页：Vue/Nuxt 工程化、Agent Skill、开源工具与技术文章。',
        },
        { key: 'theme-color', name: 'theme-color', content: '#1a1520' },
      ],
      script: [
        {
          key: 'cerrda-favicon',
          innerHTML: faviconBootScript(baseURL),
          tagPosition: 'head',
        },
        {
          key: 'cerrda-boot-gate',
          innerHTML:
            '(function(){try{document.documentElement.classList.add("booting")}catch(e){}})()',
          tagPosition: 'head',
        },
      ],
      link: [
        { key: 'apple-touch-icon', rel: 'apple-touch-icon', sizes: '180x180', href: '/apple-touch-icon.png' },
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: 'anonymous' },
        {
          rel: 'stylesheet',
          href: 'https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600;9..144,700&family=Sora:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap',
        },
        { rel: 'preload', href: '/editorial/sheer-descent-subject.png', as: 'image' },
        { rel: 'preload', href: '/hero/shoreline.png', as: 'image' },
      ],
    },
  },
  vite: {
    plugins: [tailwindcss()],
  },
  nitro: {
    preset: 'static',
    prerender: {
      crawlLinks: true,
      routes: [
        '/',
        '/articles/scrapling-config-crawl-skill',
        '/articles/faker-mock-setup-skill',
        '/articles/unocss-svg-hmr',
        '/articles/vue3-vcopy',
        '/articles/unocss-icons',
        '/articles/tooltip-perf',
        '/articles/v-ellipsis-tooltip',
        '/articles/uniapp-nav-bar',
        '/articles/fnm-windows',
      ],
    },
  },
  routeRules: {
    '/': { prerender: true },
    '/articles/**': { prerender: true },
  },
})
