import { withAppBase } from '../utils/withAppBase'

export const faviconStorageKey = 'cerrda-color-mode'

export const faviconAssets = {
  dark: {
    png16: '/favicon-16x16.png',
    png32: '/favicon-32x32.png',
    ico: '/favicon.ico',
    apple: '/apple-touch-icon.png',
    themeColor: '#1a1520',
  },
  light: {
    png16: '/favicon-light-16x16.png',
    png32: '/favicon-light-32x32.png',
    ico: '/favicon-light.ico',
    apple: '/apple-touch-icon-light.png',
    themeColor: '#f7dce6',
  },
} as const

export type FaviconTheme = keyof typeof faviconAssets

/** 浏览器对 favicon 缓存很凶，改 href 不够，必须卸掉旧 link 再挂新的。 */
export function applyThemeFavicon(theme: FaviconTheme, baseURL = '/') {
  if (typeof document === 'undefined') return

  const assets = faviconAssets[theme]
  const href = (path: string) => withAppBase(path, baseURL)

  document.querySelectorAll('link[rel="icon"], link[rel="shortcut icon"]').forEach((node) => node.remove())

  const specs: Array<{ type: string; sizes?: string; href: string }> = [
    { type: 'image/png', sizes: '32x32', href: href(assets.png32) },
    { type: 'image/png', sizes: '16x16', href: href(assets.png16) },
    { type: 'image/x-icon', href: href(assets.ico) },
  ]

  for (const spec of specs) {
    const link = document.createElement('link')
    link.rel = 'icon'
    link.type = spec.type
    if (spec.sizes) link.setAttribute('sizes', spec.sizes)
    link.href = spec.href
    document.head.appendChild(link)
  }

  const apple = document.querySelector('link[rel="apple-touch-icon"]')
  if (apple) apple.setAttribute('href', href(assets.apple))

  let themeColor = document.querySelector('meta[name="theme-color"]')
  if (!themeColor) {
    themeColor = document.createElement('meta')
    themeColor.setAttribute('name', 'theme-color')
    document.head.appendChild(themeColor)
  }
  themeColor.setAttribute('content', assets.themeColor)

  const colorScheme = document.querySelector('meta[name="color-scheme"]')
  if (colorScheme) colorScheme.setAttribute('content', theme)
}

const darkCanvas = faviconAssets.dark.themeColor
const lightCanvas = faviconAssets.light.themeColor

/** 主 CSS 到达前先铺暗色画布，并盖住未样式化内容。 */
export const themeBootStyle = [
  `html{color-scheme:dark;background-color:${darkCanvas}}`,
  `html,body,#__nuxt{background-color:${darkCanvas}}`,
  `html.light,html.light body,html.light #__nuxt{color-scheme:light;background-color:${lightCanvas}}`,
  `html.booting::after{content:"";position:fixed;inset:0;z-index:199;background-color:${darkCanvas};pointer-events:none}`,
  `html.light.booting::after{background-color:${lightCanvas}}`,
  `html.booting:has([data-theme-burn="loader"])::after{content:none}`,
  `[data-theme-burn="loader"]{position:fixed;inset:0;z-index:200;overflow:hidden;display:flex;align-items:center;justify-content:center;width:100%;height:100%;background-color:${darkCanvas};color:#f4eef2}`,
  `html.light [data-theme-burn="loader"]{background-color:${lightCanvas};color:#1a1520}`,
  `[data-theme-burn="loader"] svg{width:24px;height:24px;flex-shrink:0;display:block}`,
  `[data-theme-burn="loader"] .cerrda-loader-close{display:none}`,
  `[data-theme-burn="loader"] .cerrda-loader-panel{position:relative;z-index:10;height:24rem}`,
  `[data-theme-burn="loader"] .cerrda-loader-list{position:relative;margin:10rem auto 0;display:flex;flex-direction:column;max-width:36rem;width:100%;padding:0 1.25rem}`,
  `[data-theme-burn="loader"] .cerrda-loader-row{display:flex;align-items:center;gap:.5rem;margin-bottom:1rem;text-align:left}`,
  `[data-theme-burn="loader"] .cerrda-loader-text{font-size:1.125rem;line-height:1.75rem}`,
  `@keyframes cerrda-boot-spin{to{transform:rotate(360deg)}}`,
  `[data-theme-burn="loader"] .cerrda-loader-spin{animation:cerrda-boot-spin 1s linear infinite;color:#e8a4b8}`,
  `html.booted #cerrda-boot-ssr,html:has(#__nuxt [data-theme-burn="loader"]) #cerrda-boot-ssr{display:none}`,
  `html.booting .app-shell{opacity:0;visibility:hidden;pointer-events:none}`,
].join('')

const bootSteps = [
  ['spin', '载入字体与视觉系统'],
  ['wait', '预热 GPU 与丝绸着色器'],
  ['wait', '编译三维光轨引擎'],
  ['wait', '缓存图像与粒子层'],
  ['wait', '同步交互层'],
] as const

const spinSvg =
  '<svg class="cerrda-loader-spin" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path fill-rule="evenodd" d="M4.755 10.059a7.5 7.5 0 0 1 12.548-3.364l1.903 1.903h-3.183a.75.75 0 1 0 0 1.5h4.992a.75.75 0 0 0 .75-.75V4.356a.75.75 0 0 0-1.5 0v3.18l-1.9-1.9A9 9 0 0 0 3.306 9.67a.75.75 0 1 0 1.45.388Zm15.408 3.352a.75.75 0 0 0-.919.53 7.5 7.5 0 0 1-12.548 3.364l-1.902-1.903h3.183a.75.75 0 0 0 0-1.5H2.984a.75.75 0 0 0-.75.75v4.992a.75.75 0 0 0 1.5 0v-3.18l1.9 1.9a9 9 0 0 0 15.059-4.035.75.75 0 0 0-.53-.918Z" clip-rule="evenodd"/></svg>'
const waitSvg =
  '<svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" aria-hidden="true" style="opacity:.45"><path stroke-linecap="round" stroke-linejoin="round" d="M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"/></svg>'

/** 写在 body 最前，刷新第一帧就是步骤，不必等 Vue / Tailwind。 */
export const themeBootLoaderHtml = `<div id="cerrda-boot-ssr" data-theme-burn="loader">${`<div class="cerrda-loader-panel"><div class="cerrda-loader-list">${bootSteps
  .map(
    ([kind, text], index) =>
      `<div class="cerrda-loader-row" style="opacity:${index === 0 ? 1 : Math.max(1 - index * 0.2, 0.2)}">${
        kind === 'spin' ? spinSvg : waitSvg
      }<span class="cerrda-loader-text">${text}</span></div>`,
  )
  .join('')}</div></div>`}</div>`

function themeFromStorageExpr(keyJson: string) {
  return `var p=localStorage.getItem(${keyJson});if(p!=="light"&&p!=="dark"){p="dark";try{localStorage.setItem(${keyJson},"dark")}catch(e){}}var d=p!=="light";`
}

/** 阻塞脚本：立刻打上 dark/light + booting，并改 color-scheme，避免浏览器默认白底。 */
export function themeClassBootScript() {
  const key = JSON.stringify(faviconStorageKey)
  return `(function(){try{var el=document.documentElement;el.classList.add("booting");${themeFromStorageExpr(key)}el.classList.remove(d?"light":"dark");el.classList.add(d?"dark":"light");el.style.colorScheme=d?"dark":"light";el.style.backgroundColor=d?"${darkCanvas}":"${lightCanvas}";var m=document.querySelector('meta[name="color-scheme"]');if(m)m.setAttribute("content",d?"dark":"light")}catch(e){try{document.documentElement.classList.add("booting","dark")}catch(e2){}}})();`
}

/** 阻塞脚本：在 hydration 前按 localStorage 摆好图标，避免浅色用户先闪暗色 tab。 */
export function faviconBootScript(baseURL = '/') {
  const base = JSON.stringify(baseURL === '/' ? '' : baseURL.replace(/\/$/, ''))
  const key = JSON.stringify(faviconStorageKey)
  const dark = JSON.stringify(faviconAssets.dark)
  const light = JSON.stringify(faviconAssets.light)

  return `(function(){try{var b=${base};${themeFromStorageExpr(key)}var a=d?${dark}:${light};document.querySelectorAll('link[rel="icon"],link[rel="shortcut icon"]').forEach(function(n){n.remove()});function add(t,s,h){var l=document.createElement("link");l.rel="icon";l.type=t;if(s)l.setAttribute("sizes",s);l.href=b+h;document.head.appendChild(l)}add("image/png","32x32",a.png32);add("image/png","16x16",a.png16);add("image/x-icon","",a.ico);var apple=document.querySelector('link[rel="apple-touch-icon"]');if(apple)apple.setAttribute("href",b+a.apple);var m=document.querySelector('meta[name="theme-color"]');if(m)m.setAttribute("content",a.themeColor)}catch(e){}})();`
}
