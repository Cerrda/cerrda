import { themeBootLoaderHtml, themeBootStyle } from '../../app/data/favicon'

/**
 * 把 color-scheme / 暗色画布插到 head 最前。
 * 应用 CSS 必须保持 render-blocking：改成 media=print 后，
 * JS 会先揭掉 booting 遮罩，未样式化的 img / svg 会闪成方框。
 */
export default defineNitroPlugin((nitro) => {
  nitro.hooks.hook('render:html', (html) => {
    html.head.unshift(
      `<meta name="color-scheme" content="dark">`,
      `<style id="cerrda-theme-boot">${themeBootStyle}</style>`,
    )
    html.bodyPrepend.unshift(themeBootLoaderHtml)
  })
})
