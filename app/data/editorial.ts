/**
 * Brand mark：Photo Abstract Editorial 主体（透明 PNG）。
 *
 * 换图步骤：
 * 1. 原片放到 public/editorial/sources/<name>.png
 * 2. /photo-abstract-editorial 生成完整拼图 → public/editorial/<name>.png
 * 3. 运行 node/python 抠主体，或 scripts/extract-editorial-subject.py
 * 4. 更新下方 src / alt / title
 */
export type EditorialArtwork = {
  /** public 下的成品路径，如 /editorial/sheer-descent.png */
  src: string
  alt: string
  /** 作品英文标题（成品图内已排版；此处仅供无障碍 / 元数据） */
  title: string
  /** 可选：原片路径，方便下次用 skill 重跑 */
  sourceSrc?: string
}

export const brandEditorial: EditorialArtwork = {
  src: '/editorial/sheer-descent-subject.png',
  alt: 'Sheer Descent — Cerrda brand abstract mark',
  title: 'Sheer Descent',
}
