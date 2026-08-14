import { themeBootStyle } from '../../app/data/favicon'

function deferStylesheet(tag: string) {
  return tag.replace(/<link\b([^>]*\brel=["']stylesheet["'][^>]*)>/gi, (full, attrs: string) => {
    if (/\bmedia\s*=/i.test(attrs) || /\bonload\s*=/i.test(attrs)) return full
    return `<link media="print" onload="this.media='all'"${attrs}>`
  })
}

/**
 * 1. 把 color-scheme / 暗色画布插到 head 最前
 * 2. 所有 stylesheet 改为非阻塞，避免浏览器等 CSS 时先铺白底
 */
export default defineNitroPlugin((nitro) => {
  nitro.hooks.hook('render:html', (html) => {
    html.head = html.head.map(deferStylesheet)
    html.head.unshift(
      `<meta name="color-scheme" content="dark">`,
      `<style id="cerrda-theme-boot">${themeBootStyle}</style>`,
    )
  })
})
