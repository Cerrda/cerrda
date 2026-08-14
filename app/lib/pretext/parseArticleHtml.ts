import type { ArticleBlock, ArticleSpan, OverlaySpec } from './types'

type SpanStyle = {
  strong: boolean
  em: boolean
  code: boolean
  href?: string
}

const SKIP_META = /^meta\s*description\s*:/i

function isElement(node: Node): node is HTMLElement {
  return node.nodeType === Node.ELEMENT_NODE
}

function mergeSpans(spans: ArticleSpan[]): ArticleSpan[] {
  const out: ArticleSpan[] = []
  for (const span of spans) {
    if (!span.text) continue
    const last = out[out.length - 1]
    if (
      last
      && last.strong === span.strong
      && last.em === span.em
      && last.code === span.code
      && last.href === span.href
    ) {
      last.text += span.text
    } else {
      out.push({ ...span })
    }
  }
  return out
}

function collectSpans(node: Node, style: SpanStyle, out: ArticleSpan[]) {
  if (node.nodeType === Node.TEXT_NODE) {
    const text = node.textContent ?? ''
    if (text) out.push({ text, ...style })
    return
  }
  if (!isElement(node)) return

  const tag = node.tagName
  if (tag === 'BR') {
    out.push({ text: ' ', ...style })
    return
  }
  if (tag === 'IMG' || tag === 'PRE' || tag === 'TABLE' || tag === 'HR') return

  const next: SpanStyle = { ...style }
  if (tag === 'STRONG' || tag === 'B') next.strong = true
  if (tag === 'EM' || tag === 'I') next.em = true
  if (tag === 'CODE' || tag === 'KBD' || tag === 'SAMP') next.code = true
  if (tag === 'A') {
    const href = node.getAttribute('href')
    if (href) next.href = href
  }

  for (const child of node.childNodes) collectSpans(child, next, out)
}

function spansFrom(node: Node): ArticleSpan[] {
  const spans: ArticleSpan[] = []
  collectSpans(node, { strong: false, em: false, code: false }, spans)
  return mergeSpans(spans)
}

function spansText(spans: ArticleSpan[]) {
  return spans.map((span) => span.text).join('').replace(/\s+/g, ' ').trim()
}

function findImages(node: Node): { src: string; alt: string }[] {
  if (!isElement(node)) return []
  return [...node.querySelectorAll('img')]
    .map((img) => ({
      src: img.getAttribute('src') || '',
      alt: img.getAttribute('alt') || '',
    }))
    .filter((img) => img.src)
}

let overlaySeq = 0

function nextOverlayId(kind: string) {
  overlaySeq += 1
  return `${kind}-${overlaySeq}`
}

function pushHeading(blocks: ArticleBlock[], el: HTMLElement, skipFirstH1: { done: boolean }) {
  const level = Number(el.tagName.slice(1)) as 1 | 2 | 3 | 4
  if (level === 1 && !skipFirstH1.done) {
    skipFirstH1.done = true
    return
  }
  const spans = spansFrom(el)
  if (!spansText(spans)) return
  blocks.push({ type: 'heading', level: level > 4 ? 4 : level, spans })
}

function pushParagraphLike(blocks: ArticleBlock[], el: HTMLElement, type: 'paragraph' | 'blockquote') {
  for (const img of findImages(el)) {
    blocks.push({ type: 'image', id: nextOverlayId('img'), src: img.src, alt: img.alt })
  }
  const spans = spansFrom(el)
  const text = spansText(spans)
  if (!text) return
  if (type === 'paragraph' && SKIP_META.test(text)) return
  blocks.push({ type, spans })
}

function pushList(blocks: ArticleBlock[], el: HTMLElement) {
  const ordered = el.tagName === 'OL'
  const items: ArticleSpan[][] = []
  for (const li of el.querySelectorAll(':scope > li')) {
    for (const img of findImages(li)) {
      blocks.push({ type: 'image', id: nextOverlayId('img'), src: img.src, alt: img.alt })
    }
    const spans = spansFrom(li)
    if (spansText(spans)) items.push(spans)
  }
  if (items.length) blocks.push({ type: 'list', ordered, items })
}

function walk(parent: Node, blocks: ArticleBlock[], skipFirstH1: { done: boolean }) {
  for (const node of parent.childNodes) {
    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent?.replace(/\s+/g, ' ').trim()
      if (text) blocks.push({ type: 'paragraph', spans: [{ text, strong: false, em: false, code: false }] })
      continue
    }
    if (!isElement(node)) continue

    const tag = node.tagName
    if (tag === 'H1' || tag === 'H2' || tag === 'H3' || tag === 'H4' || tag === 'H5' || tag === 'H6') {
      pushHeading(blocks, node, skipFirstH1)
      continue
    }
    if (tag === 'P') {
      pushParagraphLike(blocks, node, 'paragraph')
      continue
    }
    if (tag === 'BLOCKQUOTE') {
      const innerPs = [...node.querySelectorAll(':scope > p')]
      if (innerPs.length) {
        for (const p of innerPs) pushParagraphLike(blocks, p, 'blockquote')
      } else {
        pushParagraphLike(blocks, node, 'blockquote')
      }
      continue
    }
    if (tag === 'UL' || tag === 'OL') {
      pushList(blocks, node)
      continue
    }
    if (tag === 'PRE') {
      const code = node.querySelector('code')
      const lang = (code?.className.match(/language-([\w-]+)/)?.[1] || '').trim()
      const text = (code?.textContent ?? node.textContent ?? '').replace(/\n$/, '')
      if (text) blocks.push({ type: 'code', lang, text })
      continue
    }
    if (tag === 'TABLE') {
      blocks.push({ type: 'table', id: nextOverlayId('table'), html: node.outerHTML })
      continue
    }
    if (tag === 'HR') {
      blocks.push({ type: 'hr' })
      continue
    }
    if (tag === 'IMG') {
      const src = node.getAttribute('src') || ''
      if (src) blocks.push({ type: 'image', id: nextOverlayId('img'), src, alt: node.getAttribute('alt') || '' })
      continue
    }
    if (tag === 'FIGURE') {
      for (const img of findImages(node)) {
        blocks.push({ type: 'image', id: nextOverlayId('img'), src: img.src, alt: img.alt })
      }
      continue
    }
    walk(node, blocks, skipFirstH1)
  }
}

export function parseArticleHtml(html: string, skipFirstHeading = true): ArticleBlock[] {
  overlaySeq = 0
  const doc = new DOMParser().parseFromString(`<div id="root">${html}</div>`, 'text/html')
  const root = doc.getElementById('root')
  if (!root) return []
  const blocks: ArticleBlock[] = []
  walk(root, blocks, { done: !skipFirstHeading })
  return blocks
}

export function overlaySpecsFrom(blocks: ArticleBlock[]): OverlaySpec[] {
  const specs: OverlaySpec[] = []
  for (const block of blocks) {
    if (block.type === 'table') specs.push({ id: block.id, type: 'table', html: block.html })
    if (block.type === 'image') specs.push({ id: block.id, type: 'image', src: block.src, alt: block.alt })
  }
  return specs
}
