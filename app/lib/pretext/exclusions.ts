import type { CircleExclusion, HorzRange } from './types'

export const MIN_LINE_WIDTH = 36

export function subtractRanges(ranges: HorzRange[], left: number, right: number): HorzRange[] {
  const result: HorzRange[] = []
  for (const range of ranges) {
    if (right <= range.left || left >= range.right) {
      result.push(range)
      continue
    }
    if (left > range.left) result.push({ left: range.left, right: left })
    if (right < range.right) result.push({ left: right, right: range.right })
  }
  return result
}

export function circleStripRange(circle: CircleExclusion, top: number, bottom: number): HorzRange | null {
  const radius = circle.radius
  if (circle.y + radius < top || circle.y - radius > bottom) return null

  const mid = (top + bottom) / 2
  const distToMid = Math.abs(circle.y - mid)
  const halfHeight = (bottom - top) / 2
  const gap = Math.max(0, distToMid - halfHeight)
  if (gap >= radius) return null

  const halfWidth = Math.sqrt(radius * radius - gap * gap)
  return { left: circle.x - halfWidth, right: circle.x + halfWidth }
}

export function mergeRanges(rects: HorzRange[]): HorzRange[] {
  if (rects.length <= 1) return rects
  const sorted = [...rects].sort((a, b) => a.left - b.left)
  const merged = [sorted[0]!]
  for (let i = 1; i < sorted.length; i++) {
    const next = sorted[i]!
    const last = merged[merged.length - 1]!
    if (next.left <= last.right) last.right = Math.max(last.right, next.right)
    else merged.push(next)
  }
  return merged
}

export function availableRanges(
  y: number,
  lineHeight: number,
  left: number,
  right: number,
  circles: CircleExclusion[],
): HorzRange[] {
  let ranges: HorzRange[] = [{ left, right }]
  const top = y
  const bottom = y + lineHeight

  const cuts: HorzRange[] = []
  for (const circle of circles) {
    const cut = circleStripRange(circle, top, bottom)
    if (cut) cuts.push(cut)
  }

  for (const cut of mergeRanges(cuts)) {
    ranges = subtractRanges(ranges, cut.left, cut.right)
  }

  return ranges.filter((range) => range.right - range.left >= MIN_LINE_WIDTH)
}
