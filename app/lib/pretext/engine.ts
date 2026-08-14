import {
  layoutNextLineRange,
  materializeLineRange,
  prepareWithSegments,
  setLocale,
  type PreparedTextWithSegments,
  type LayoutCursor,
} from '@chenglou/pretext'
import { availableRanges } from './exclusions'
import { packFlowRange, prepareFlowGlyphs, type FlowFragment, type FlowGlyph } from './flowLayout'
import {
  chainHasPresence,
  createMouseChain,
  getChainExclusions,
  getInkExclusions,
  getInkInfluence,
  IDLE_TIMEOUT,
  resizeMouseChain,
  spawnInk,
  updateInk,
  updateMouseChain,
  type MouseChain,
} from './mouseChain'
import { overlaySpecsFrom, parseArticleHtml } from './parseArticleHtml'
import { buildMetrics, flowFontFor, readArticleTheme } from './theme'
import type { ArticleBlock, ArticleMetrics, ArticleSpan, ArticleTheme, FlowItem, LinkHit, OverlaySpec } from './types'

type FlowPrepared = {
  kind: 'flow'
  variant: 'heading' | 'paragraph' | 'blockquote' | 'list-item'
  glyphs: FlowGlyph[]
  items: FlowItem[]
  lineHeight: number
  indent: number
  marginTop: number
  marginBottom: number
  quote: boolean
  bullet?: string
}

type CodePrepared = {
  kind: 'code'
  prepared: PreparedTextWithSegments
  lineHeight: number
  pad: number
  marginTop: number
  marginBottom: number
}

type OverlayPrepared = {
  kind: 'overlay'
  id: string
  marginTop: number
  marginBottom: number
  fallbackHeight: number
}

type HrPrepared = {
  kind: 'hr'
  marginTop: number
  marginBottom: number
}

type PreparedUnit = FlowPrepared | CodePrepared | OverlayPrepared | HrPrepared

type DrawnRichLine = {
  x: number
  y: number
  lineHeight: number
  items: FlowItem[]
  fragments: FlowFragment[]
}

type DrawnCodeLine = {
  x: number
  y: number
  text: string
}

type OverlayLayout = {
  id: string
  y: number
  height: number
}

const MAX_FLOW_LINES = 2400

function quoteStack(name: string) {
  return name.includes(' ') ? `"${name}"` : name
}

function spansToItems(
  spans: ArticleSpan[],
  metrics: ArticleMetrics,
  theme: ArticleTheme,
  opts?: { headingFont?: string; fill?: string },
): FlowItem[] {
  const items: FlowItem[] = []
  const fill = opts?.fill ?? theme.foreground
  for (const span of spans) {
    items.push({
      text: span.text,
      font: span.code
        ? metrics.inlineCodeFont
        : opts?.headingFont || flowFontFor(span, quoteStack(theme.fontSans), metrics),
      extraWidth: span.code ? 10 : 0,
      break: span.code ? 'never' : 'normal',
      color: span.href ? theme.primary : span.code ? theme.foreground : fill,
      href: span.href,
      code: span.code,
    })
  }
  return items.filter((item) => item.text.length > 0)
}

export class PretextArticleEngine {
  private canvas: HTMLCanvasElement
  private wrap: HTMLElement
  private ctx: CanvasRenderingContext2D
  private skipFirstHeading: boolean
  private chain: MouseChain
  private theme: ArticleTheme
  private metrics: ArticleMetrics
  private units: PreparedUnit[] = []
  private overlays: OverlaySpec[] = []
  private overlayHeights = new Map<string, number>()
  private overlayLayouts: OverlayLayout[] = []
  private bullets: { x: number; y: number; text: string }[] = []
  private richLines: DrawnRichLine[] = []
  private codeLines: DrawnCodeLine[] = []
  private codeFrames: { x: number; y: number; w: number; h: number }[] = []
  private quoteBars: { x: number; y: number; h: number }[] = []
  private hrs: { y: number; left: number; right: number }[] = []
  private linkHits: LinkHit[] = []
  private hoveredHref: string | null = null
  private pointer = { x: 0, y: 0, inside: false }
  private lastPointerAt = -Infinity
  private lastClient = { x: 0, y: 0 }
  private naturalHeight = 0
  private contentHeight = 0
  private dpr = 1
  private raf = 0
  private running = false
  private localeReady = false
  private onHeight?: (height: number) => void

  constructor(opts: {
    canvas: HTMLCanvasElement
    wrap: HTMLElement
    skipFirstHeading?: boolean
    onHeight?: (height: number) => void
  }) {
    const ctx = opts.canvas.getContext('2d')
    if (!ctx) throw new Error('Canvas 2D unavailable')
    this.canvas = opts.canvas
    this.wrap = opts.wrap
    this.ctx = ctx
    this.skipFirstHeading = opts.skipFirstHeading ?? true
    this.onHeight = opts.onHeight
    this.theme = readArticleTheme(opts.wrap)
    this.metrics = buildMetrics(Math.max(320, opts.wrap.clientWidth), this.theme)
    this.chain = createMouseChain(this.metrics.width / 2, 80, this.chainScale())
  }

  getOverlaySpecs() {
    return this.overlays
  }

  async init(html: string) {
    if (!this.localeReady) {
      setLocale('zh-CN')
      this.localeReady = true
    }
    await Promise.race([
      document.fonts.ready,
      new Promise<void>((resolve) => {
        window.setTimeout(resolve, 1800)
      }),
    ])
    this.lastHtml = html
    this.theme = readArticleTheme(this.wrap)
    this.metrics = buildMetrics(Math.max(280, this.wrap.clientWidth || this.metrics.width), this.theme)
    this.syncSize()
    const blocks = parseArticleHtml(html, this.skipFirstHeading)
    this.overlays = overlaySpecsFrom(blocks)
    this.overlayHeights.clear()
    this.units = this.prepareBlocks(blocks)
    this.chain = createMouseChain(this.metrics.width / 2, 40, this.chainScale())
    this.naturalHeight = 0
    this.layout(true)
    this.draw()
  }

  start() {
    if (this.running) return
    this.running = true
    this.schedule()
  }

  stop() {
    this.running = false
    if (this.raf) cancelAnimationFrame(this.raf)
    this.raf = 0
  }

  destroy() {
    this.stop()
  }

  setPointerClient(clientX: number, clientY: number, inside: boolean) {
    this.lastClient = { x: clientX, y: clientY }
    const rect = this.canvas.getBoundingClientRect()
    this.pointer = {
      x: clientX - rect.left,
      y: clientY - rect.top,
      inside,
    }
    this.lastPointerAt = performance.now()
    this.hoveredHref = this.hitLink(this.pointer.x, this.pointer.y)
    this.schedule()
  }

  syncPointerFromScroll() {
    if (!this.lastClient.x && !this.lastClient.y) return
    const rect = this.canvas.getBoundingClientRect()
    const x = this.lastClient.x - rect.left
    const y = this.lastClient.y - rect.top
    const inside = x >= 0 && y >= 0 && x <= rect.width && y <= rect.height
    this.pointer = { x, y, inside }
    this.hoveredHref = this.hitLink(x, y)
    this.schedule()
  }

  pointerDown(clientX: number, clientY: number): { href?: string } {
    const rect = this.canvas.getBoundingClientRect()
    const x = clientX - rect.left
    const y = clientY - rect.top
    const href = this.hitLink(x, y)
    if (href) return { href }
    const head = this.chain.segments[0]
    const angle = (head?.angle ?? Math.PI / 2) - Math.PI / 2
    spawnInk(this.chain, x, y, angle)
    this.schedule()
    return {}
  }

  setOverlayHeight(id: string, height: number) {
    const prev = this.overlayHeights.get(id) ?? 0
    if (Math.abs(prev - height) < 1) return
    this.overlayHeights.set(id, height)
    this.layout(true)
    this.positionOverlays()
    this.draw()
  }

  refreshTheme() {
    this.theme = readArticleTheme(this.wrap)
    this.draw()
  }

  resize() {
    const width = Math.max(280, this.wrap.clientWidth)
    const prevWidth = this.metrics.width
    this.theme = readArticleTheme(this.wrap)
    this.metrics = buildMetrics(width, this.theme)
    resizeMouseChain(this.chain, this.chainScale())
    if (Math.abs(prevWidth - this.metrics.width) >= 1) {
      this.units = this.prepareBlocks(parseArticleHtml(this.lastHtml, this.skipFirstHeading))
    }
    this.naturalHeight = 0
    this.syncSize()
    this.layout(true)
    this.positionOverlays()
    this.draw()
  }

  private lastHtml = ''

  private chainScale() {
    return Math.min(1, Math.max(0.72, this.metrics.width / 680))
  }

  private glyphsFromItems(items: FlowItem[]) {
    this.ctx.setTransform(1, 0, 0, 1, 0, 0)
    return prepareFlowGlyphs(items, (font, text) => {
      this.ctx.font = font
      return this.ctx.measureText(text).width
    })
  }

  private prepareBlocks(blocks: ArticleBlock[]): PreparedUnit[] {
    const units: PreparedUnit[] = []
    const { metrics, theme } = this

    for (const block of blocks) {
      if (block.type === 'heading') {
        const font = block.level <= 2 ? metrics.h2Font : block.level === 3 ? metrics.h3Font : metrics.h4Font
        const lineHeight = block.level <= 2 ? metrics.h2Line : block.level === 3 ? metrics.h3Line : metrics.h4Line
        const items = spansToItems(block.spans, metrics, theme, { headingFont: font })
        if (!items.length) continue
        units.push({
          kind: 'flow',
          variant: 'heading',
          glyphs: this.glyphsFromItems(items),
          items,
          lineHeight,
          indent: 0,
          marginTop: block.level <= 2 ? 36 : 26,
          marginBottom: 8,
          quote: false,
        })
        continue
      }

      if (block.type === 'paragraph' || block.type === 'blockquote') {
        const items = spansToItems(block.spans, metrics, theme, {
          fill: block.type === 'blockquote' ? theme.muted : theme.foreground,
        })
        if (!items.length) continue
        units.push({
          kind: 'flow',
          variant: block.type === 'blockquote' ? 'blockquote' : 'paragraph',
          glyphs: this.glyphsFromItems(items),
          items,
          lineHeight: metrics.bodyLine,
          indent: block.type === 'blockquote' ? 18 : 0,
          marginTop: 14,
          marginBottom: 4,
          quote: block.type === 'blockquote',
        })
        continue
      }

      if (block.type === 'list') {
        block.items.forEach((spans, index) => {
          const items = spansToItems(spans, metrics, theme)
          if (!items.length) return
          units.push({
            kind: 'flow',
            variant: 'list-item',
            glyphs: this.glyphsFromItems(items),
            items,
            lineHeight: metrics.bodyLine,
            indent: block.ordered ? 28 : 22,
            marginTop: index === 0 ? 12 : 4,
            marginBottom: 2,
            quote: false,
            bullet: block.ordered ? `${index + 1}.` : '•',
          })
        })
        continue
      }

      if (block.type === 'code') {
        units.push({
          kind: 'code',
          prepared: prepareWithSegments(block.text, metrics.codeFont, { whiteSpace: 'pre-wrap' }),
          lineHeight: metrics.codeLine,
          pad: 16,
          marginTop: 16,
          marginBottom: 12,
        })
        continue
      }

      if (block.type === 'table' || block.type === 'image') {
        units.push({
          kind: 'overlay',
          id: block.id,
          marginTop: 18,
          marginBottom: 12,
          fallbackHeight: block.type === 'image' ? Math.round(metrics.width * 0.52) : 160,
        })
        continue
      }

      units.push({ kind: 'hr', marginTop: 18, marginBottom: 18 })
    }

    return units
  }

  async reparse(html: string) {
    this.lastHtml = html
    await this.init(html)
  }

  private layout(_force = false) {
    const width = this.metrics.width
    const exclusions = [
      ...getChainExclusions(this.chain, -40, this.contentHeight + 80),
      ...getInkExclusions(this.chain, -40, this.contentHeight + 80),
    ]
    const richLines: DrawnRichLine[] = []
    const codeLines: DrawnCodeLine[] = []
    const codeFrames: { x: number; y: number; w: number; h: number }[] = []
    const quoteBars: { x: number; y: number; h: number }[] = []
    const hrs: { y: number; left: number; right: number }[] = []
    const overlayLayouts: OverlayLayout[] = []
    const linkHits: LinkHit[] = []
    const bullets: { x: number; y: number; text: string }[] = []

    let y = 0
    const left = 0
    const right = width

    for (const unit of this.units) {
      y += unit.marginTop

      if (unit.kind === 'hr') {
        hrs.push({ y: y + 6, left, right })
        y += 12 + unit.marginBottom
        continue
      }

      if (unit.kind === 'overlay') {
        const height = Math.max(40, this.overlayHeights.get(unit.id) ?? unit.fallbackHeight)
        overlayLayouts.push({ id: unit.id, y, height })
        y += height + unit.marginBottom
        continue
      }

      if (unit.kind === 'code') {
        const innerLeft = left + unit.pad
        const innerWidth = Math.max(40, right - left - unit.pad * 2)
        const startY = y + unit.pad
        let cursor: LayoutCursor = { segmentIndex: 0, graphemeIndex: 0 }
        let lineY = startY
        let lineCount = 0
        while (lineCount < MAX_FLOW_LINES) {
          const range = layoutNextLineRange(unit.prepared, cursor, innerWidth)
          if (!range) break
          const line = materializeLineRange(unit.prepared, range)
          codeLines.push({ x: innerLeft, y: lineY, text: line.text })
          cursor = line.end
          lineY += unit.lineHeight
          lineCount++
        }
        const height = Math.max(unit.lineHeight, lineY - startY) + unit.pad
        codeFrames.push({ x: left, y, w: right - left, h: height })
        y += height + unit.marginBottom
        continue
      }

      const flowLeft = left + unit.indent
      const startY = y
      const firstLineIndex = richLines.length
      let glyphIndex = 0
      let lineY = startY
      let done = false
      let safety = 0
      let bottom = startY

      while (!done && safety < MAX_FLOW_LINES) {
        safety++
        const ranges = availableRanges(lineY, unit.lineHeight, flowLeft, right, exclusions)
        if (!ranges.length) {
          lineY += unit.lineHeight
          bottom = lineY
          continue
        }

        const indexBefore = glyphIndex
        for (let r = 0; r < ranges.length; r++) {
          const range = ranges[r]!
          const splitWord = r < ranges.length - 1
          const packed = packFlowRange(unit.glyphs, glyphIndex, range.right - range.left, splitWord)
          if (packed.end === glyphIndex && packed.fragments.length === 0) continue
          glyphIndex = packed.end
          if (packed.fragments.length) {
            richLines.push({
              x: range.left,
              y: lineY,
              lineHeight: unit.lineHeight,
              items: unit.items,
              fragments: packed.fragments,
            })
            this.collectLinkHits(packed.fragments, unit.items, range.left, lineY, unit.lineHeight, linkHits)
            bottom = lineY + unit.lineHeight
          }
          if (glyphIndex >= unit.glyphs.length) {
            done = true
            break
          }
        }

        if (!done && glyphIndex === indexBefore) {
          const fallback = ranges[ranges.length - 1]!
          const packed = packFlowRange(unit.glyphs, glyphIndex, fallback.right - fallback.left, false, true)
          if (packed.end === glyphIndex) {
            done = true
          } else {
            glyphIndex = packed.end
            if (packed.fragments.length) {
              richLines.push({
                x: fallback.left,
                y: lineY,
                lineHeight: unit.lineHeight,
                items: unit.items,
                fragments: packed.fragments,
              })
              this.collectLinkHits(packed.fragments, unit.items, fallback.left, lineY, unit.lineHeight, linkHits)
              bottom = lineY + unit.lineHeight
            }
          }
          if (glyphIndex >= unit.glyphs.length) done = true
        }

        if (!done) lineY += unit.lineHeight
      }

      if (unit.bullet) {
        const first = richLines[firstLineIndex]
        bullets.push({
          x: left,
          y: (first?.y ?? startY) + Math.max(0, (unit.lineHeight - this.metrics.bodySize) / 2),
          text: unit.bullet,
        })
      }

      if (unit.quote) {
        quoteBars.push({ x: left + 2, y: startY, h: Math.max(unit.lineHeight, bottom - startY) })
      }

      y = Math.max(bottom, startY + unit.lineHeight) + unit.marginBottom
    }

    this.richLines = richLines
    this.codeLines = codeLines
    this.codeFrames = codeFrames
    this.quoteBars = quoteBars
    this.hrs = hrs
    this.overlayLayouts = overlayLayouts
    this.linkHits = linkHits
    this.bullets = bullets

    const laidOut = Math.ceil(y + 24)
    if (!chainHasPresence(this.chain)) this.naturalHeight = Math.max(this.naturalHeight, laidOut)
    const reserved = this.metrics.bodyLine * 6
    this.contentHeight = Math.max(
      laidOut,
      this.naturalHeight,
      this.naturalHeight ? this.naturalHeight : laidOut + reserved,
    )
    this.syncSize()
    this.onHeight?.(this.contentHeight)
  }

  private collectLinkHits(
    fragments: DrawnRichLine['fragments'],
    items: FlowItem[],
    startX: number,
    y: number,
    lineHeight: number,
    hits: LinkHit[],
  ) {
    let x = startX
    for (const frag of fragments) {
      x += frag.gapBefore
      const item = items[frag.itemIndex]
      if (item?.href) {
        hits.push({ x, y, w: frag.occupiedWidth, h: lineHeight, href: item.href })
      }
      x += frag.occupiedWidth
    }
  }

  private hitLink(x: number, y: number) {
    for (let i = this.linkHits.length - 1; i >= 0; i--) {
      const hit = this.linkHits[i]!
      if (x >= hit.x && x <= hit.x + hit.w && y >= hit.y && y <= hit.y + hit.h) return hit.href
    }
    return null
  }

  positionOverlays() {
    for (const layout of this.overlayLayouts) {
      const el = this.wrap.querySelector<HTMLElement>(`[data-pretext-overlay="${layout.id}"]`)
      if (!el) continue
      el.style.transform = `translate3d(0, ${layout.y}px, 0)`
      el.style.minHeight = `${layout.height}px`
    }
  }

  private syncSize() {
    const cssW = Math.max(1, this.wrap.clientWidth)
    const cssH = Math.max(1, this.contentHeight || 240)
    const dpr = Math.min(2, Math.ceil(window.devicePixelRatio || 1))
    this.dpr = dpr
    if (this.canvas.width !== Math.round(cssW * dpr) || this.canvas.height !== Math.round(cssH * dpr)) {
      this.canvas.width = Math.round(cssW * dpr)
      this.canvas.height = Math.round(cssH * dpr)
    }
    this.canvas.style.width = `${cssW}px`
    this.canvas.style.height = `${cssH}px`
    this.wrap.style.minHeight = `${cssH}px`
    this.metrics = { ...this.metrics, width: cssW }
  }

  private schedule() {
    if (!this.running || this.raf) return
    this.raf = requestAnimationFrame((time) => this.tick(time))
  }

  private tick(time: number) {
    this.raf = 0
    const idle = time - this.lastPointerAt > IDLE_TIMEOUT
    const moved = updateMouseChain(this.chain, time, this.pointer.x, this.pointer.y, idle, this.pointer.inside)
    if (this.chain.ink.length) updateInk(this.chain, time)
    if (moved || this.chain.ink.length) {
      this.layout()
      this.positionOverlays()
    }
    this.draw()
    if (this.running && (moved || this.chain.ink.length || !idle || chainHasPresence(this.chain))) {
      this.schedule()
    }
  }

  private draw() {
    const ctx = this.ctx
    const { width } = this.metrics
    const height = this.contentHeight
    const dpr = this.dpr
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    ctx.clearRect(0, 0, width, height)
    ctx.textBaseline = 'top'
    ctx.textAlign = 'left'

    for (const bar of this.quoteBars) {
      ctx.fillStyle = this.theme.primary
      ctx.globalAlpha = 0.55
      ctx.fillRect(bar.x, bar.y, 2, bar.h)
      ctx.globalAlpha = 1
    }

    for (const hr of this.hrs) {
      ctx.strokeStyle = this.theme.border
      ctx.globalAlpha = 0.8
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(hr.left, hr.y)
      ctx.lineTo(hr.right, hr.y)
      ctx.stroke()
      ctx.globalAlpha = 1
    }

    for (const frame of this.codeFrames) {
      this.roundRect(ctx, frame.x, frame.y, frame.w, frame.h, 16)
      ctx.fillStyle = this.theme.secondary
      ctx.globalAlpha = 0.82
      ctx.fill()
      ctx.globalAlpha = 1
    }

    ctx.fillStyle = this.theme.foreground
    ctx.font = this.metrics.codeFont
    for (const line of this.codeLines) {
      ctx.fillText(line.text, line.x, line.y)
    }

    const hasInk = this.chain.ink.length > 0
    for (const line of this.richLines) {
      this.drawRichLine(line, hasInk)
    }

    this.drawBullets()
    this.drawInk()
  }

  private drawBullets() {
    if (!this.bullets.length) return
    this.ctx.fillStyle = this.theme.primary
    this.ctx.font = this.metrics.bodyFont
    for (const bullet of this.bullets) {
      this.ctx.fillText(bullet.text, bullet.x, bullet.y)
    }
  }

  private drawRichLine(line: DrawnRichLine, hasInk: boolean) {
    const ctx = this.ctx
    let x = line.x
    const baseline = line.y + Math.max(0, (line.lineHeight - this.metrics.bodySize) / 2)

    for (const frag of line.fragments) {
      x += frag.gapBefore
      const item = line.items[frag.itemIndex]
      if (!item) {
        x += frag.occupiedWidth
        continue
      }

      const textX = x + (item.code ? item.extraWidth / 2 : 0)
      const textY = item.code ? line.y + Math.max(2, (line.lineHeight - this.metrics.bodySize) / 2) : baseline

      if (item.code) {
        const pillH = this.metrics.bodySize + 6
        const pillY = line.y + (line.lineHeight - pillH) / 2
        this.roundRect(ctx, x, pillY, frag.occupiedWidth, pillH, 6)
        ctx.fillStyle = this.theme.secondary
        ctx.globalAlpha = 0.9
        ctx.fill()
        ctx.globalAlpha = 1
      }

      ctx.font = item.font
      const hovered = Boolean(item.href && item.href === this.hoveredHref)
      ctx.fillStyle = item.color
      if (hovered) ctx.globalAlpha = 0.82

      if (hasInk) {
        const influence = getInkInfluence(this.chain, textX + frag.occupiedWidth / 2, textY + this.metrics.bodySize / 2)
        if (influence.strength > 0.02) {
          const str = influence.strength
          ctx.save()
          ctx.translate(textX + influence.dx * str * 28, textY + influence.dy * str * 28)
          ctx.rotate(str * (influence.dx > 0 ? 0.18 : -0.18))
          ctx.globalAlpha = Math.max(0.25, 1 - str * 0.45)
          ctx.fillText(frag.text, 0, 0)
          ctx.restore()
          ctx.globalAlpha = 1
          x += frag.occupiedWidth
          continue
        }
      }

      ctx.fillText(frag.text, textX, textY)
      if (item.href) {
        ctx.globalAlpha = hovered ? 0.7 : 0.35
        ctx.strokeStyle = this.theme.primary
        ctx.lineWidth = 1
        ctx.beginPath()
        const underlineY = textY + this.metrics.bodySize + 1
        ctx.moveTo(textX, underlineY)
        ctx.lineTo(textX + Math.max(0, frag.occupiedWidth - item.extraWidth), underlineY)
        ctx.stroke()
        ctx.globalAlpha = 1
      }
      x += frag.occupiedWidth
    }
  }

  private drawInk() {
    const ctx = this.ctx
    for (const particle of this.chain.ink) {
      ctx.beginPath()
      ctx.fillStyle = this.theme.primary
      ctx.globalAlpha = Math.min(0.55, particle.life * 0.7)
      ctx.arc(particle.x, particle.y, Math.max(1.5, particle.size / 2), 0, Math.PI * 2)
      ctx.fill()
    }
    ctx.globalAlpha = 1
  }

  private roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
    const radius = Math.min(r, w / 2, h / 2)
    ctx.beginPath()
    ctx.moveTo(x + radius, y)
    ctx.arcTo(x + w, y, x + w, y + h, radius)
    ctx.arcTo(x + w, y + h, x, y + h, radius)
    ctx.arcTo(x, y + h, x, y, radius)
    ctx.arcTo(x, y, x + w, y, radius)
    ctx.closePath()
  }
}
