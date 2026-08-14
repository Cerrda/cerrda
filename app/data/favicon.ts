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
}

/** 阻塞脚本：在 hydration 前按 localStorage 摆好图标，避免浅色用户先闪暗色 tab。 */
export function faviconBootScript(baseURL = '/') {
  const base = JSON.stringify(baseURL === '/' ? '' : baseURL.replace(/\/$/, ''))
  const key = JSON.stringify(faviconStorageKey)
  const dark = JSON.stringify(faviconAssets.dark)
  const light = JSON.stringify(faviconAssets.light)

  return `(function(){try{var b=${base};var p=localStorage.getItem(${key});var d=p!=="light";if(p==="system")d=matchMedia("(prefers-color-scheme: dark)").matches;var a=d?${dark}:${light};document.querySelectorAll('link[rel="icon"],link[rel="shortcut icon"]').forEach(function(n){n.remove()});function add(t,s,h){var l=document.createElement("link");l.rel="icon";l.type=t;if(s)l.setAttribute("sizes",s);l.href=b+h;document.head.appendChild(l)}add("image/png","32x32",a.png32);add("image/png","16x16",a.png16);add("image/x-icon","",a.ico);var apple=document.querySelector('link[rel="apple-touch-icon"]');if(apple)apple.setAttribute("href",b+a.apple);var m=document.querySelector('meta[name="theme-color"]');if(m)m.setAttribute("content",a.themeColor)}catch(e){}})();`
}
