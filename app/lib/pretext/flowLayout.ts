import type { FlowItem } from './types'

export type FlowGlyph = {
  itemIndex: number
  text: string
  width: number
  space: boolean
  atom: boolean
}

export type FlowFragment = {
  itemIndex: number
  text: string
  gapBefore: number
  occupiedWidth: number
}

export type PackedRange = {
  end: number
  width: number
  fragments: FlowFragment[]
}

const SPACE_RE = /[\s\u00a0]/
let graphemeSegmenter: Intl.Segmenter | null = null

function getGraphemeSegmenter() {
  graphemeSegmenter ??= new Intl.Segmenter('zh-CN', { granularity: 'grapheme' })
  return graphemeSegmenter
}

export function prepareFlowGlyphs(
  items: FlowItem[],
  measure: (font: string, text: string) => number,
): FlowGlyph[] {
  const glyphs: FlowGlyph[] = []
  const segmenter = getGraphemeSegmenter()

  for (let itemIndex = 0; itemIndex < items.length; itemIndex++) {
    const item = items[itemIndex]!
    let first = true
    for (const part of segmenter.segment(item.text)) {
      const text = part.segment
      if (!text) continue
      const space = SPACE_RE.test(text)
      let width = space || !item.code ? measure(item.font, text) : 0
      if (item.code && first) {
        width = measure(item.font, item.text) + item.extraWidth
      } else if (item.code) {
        width = 0
      }
      glyphs.push({
        itemIndex,
        text,
        width,
        space,
        atom: item.code,
      })
      first = false
    }
  }

  return glyphs
}

function unitEnd(glyphs: FlowGlyph[], start: number) {
  const first = glyphs[start]
  if (!first) return start
  if (!first.atom) return start + 1
  let end = start + 1
  while (end < glyphs.length && glyphs[end]!.atom && glyphs[end]!.itemIndex === first.itemIndex) end++
  return end
}

function unitWidth(glyphs: FlowGlyph[], start: number, end: number) {
  let width = 0
  for (let i = start; i < end; i++) width += glyphs[i]!.width
  return width
}

function unitSpace(glyphs: FlowGlyph[], start: number, end: number) {
  for (let i = start; i < end; i++) {
    if (!glyphs[i]!.space) return false
  }
  return end > start
}

function skipLeadingSpace(glyphs: FlowGlyph[], start: number) {
  let i = start
  while (i < glyphs.length && glyphs[i]!.space) i++
  return i
}

function pushUnit(fragments: FlowFragment[], glyphs: FlowGlyph[], start: number, end: number, width: number) {
  const itemIndex = glyphs[start]!.itemIndex
  let text = ''
  for (let i = start; i < end; i++) text += glyphs[i]!.text
  const last = fragments[fragments.length - 1]
  if (last && last.itemIndex === itemIndex) {
    last.text += text
    last.occupiedWidth += width
    return
  }
  fragments.push({ itemIndex, text, gapBefore: 0, occupiedWidth: width })
}

function packLetters(
  glyphs: FlowGlyph[],
  start: number,
  maxWidth: number,
  allowOverflow: boolean,
): PackedRange {
  const fragments: FlowFragment[] = []
  let i = skipLeadingSpace(glyphs, start)
  let width = 0

  while (i < glyphs.length) {
    const end = unitEnd(glyphs, i)
    const nextWidth = unitWidth(glyphs, i, end)
    if (width + nextWidth > maxWidth) {
      if (width === 0 && allowOverflow) {
        pushUnit(fragments, glyphs, i, end, nextWidth)
        return { end, width: nextWidth, fragments }
      }
      break
    }
    pushUnit(fragments, glyphs, i, end, nextWidth)
    width += nextWidth
    i = end
  }

  return { end: fragments.length ? i : start, width, fragments }
}

export function packFlowRange(
  glyphs: FlowGlyph[],
  start: number,
  maxWidth: number,
  splitWord: boolean,
  allowOverflow = false,
): PackedRange {
  if (start >= glyphs.length || maxWidth <= 0) {
    return { end: start, width: 0, fragments: [] }
  }

  const contentStart = skipLeadingSpace(glyphs, start)
  if (contentStart >= glyphs.length) {
    return { end: glyphs.length, width: 0, fragments: [] }
  }

  if (splitWord) return packLetters(glyphs, start, maxWidth, allowOverflow)

  const fragments: FlowFragment[] = []
  let i = contentStart
  let width = 0
  let lastBreakEnd = i
  let lastBreakWidth = 0
  let lastBreakFragments = 0

  while (i < glyphs.length) {
    const end = unitEnd(glyphs, i)
    const nextWidth = unitWidth(glyphs, i, end)
    const space = unitSpace(glyphs, i, end)

    if (width + nextWidth > maxWidth) {
      if (lastBreakEnd > contentStart && lastBreakFragments > 0) {
        fragments.length = lastBreakFragments
        return { end: lastBreakEnd, width: lastBreakWidth, fragments }
      }
      if (width > 0) break
      return packLetters(glyphs, contentStart, maxWidth, allowOverflow)
    }

    pushUnit(fragments, glyphs, i, end, nextWidth)
    width += nextWidth
    i = end
    if (space) {
      lastBreakEnd = i
      lastBreakWidth = width
      lastBreakFragments = fragments.length
    }
  }

  return { end: fragments.length ? i : start, width, fragments }
}
