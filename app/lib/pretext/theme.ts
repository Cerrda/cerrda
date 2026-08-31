import type { ArticleMetrics, ArticleTheme } from './types'

const CJK_SANS = '"PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", "Noto Sans SC"'
const CJK_SERIF = '"Songti SC", "Noto Serif SC", "SimSun"'
const CJK_MONO = '"Sarasa Term SC", "Microsoft YaHei Mono", "Microsoft YaHei", ui-monospace'

function pickFontFamily(value: string, fallback: string) {
  const first = value
    .split(',')
    .map((part) => part.trim().replace(/^['"]|['"]$/g, ''))
    .find(
      (part) =>
        part && part !== 'ui-sans-serif' && part !== 'ui-serif' && part !== 'ui-monospace' && part !== 'system-ui',
    )
  return first || fallback
}

function quoteFamily(name: string) {
  return name.includes(' ') ? `"${name}"` : name
}

function canvasFont(
  family: string,
  size: number,
  opts?: { weight?: string | number; style?: 'italic' | ''; generic?: 'sans-serif' | 'serif' | 'monospace' },
) {
  const weight = opts?.weight ?? '400'
  const style = opts?.style ? `${opts.style} ` : ''
  const generic = opts?.generic ?? 'sans-serif'
  const cjk = generic === 'serif' ? CJK_SERIF : generic === 'monospace' ? CJK_MONO : CJK_SANS
  return `${style}${weight} ${size}px ${quoteFamily(family)}, ${cjk}, ${generic}`
}

function cssVarColor(el: HTMLElement, name: string, fallback: string) {
  const probe = document.createElement('span')
  probe.style.color = `var(${name})`
  probe.style.position = 'absolute'
  probe.style.visibility = 'hidden'
  probe.style.pointerEvents = 'none'
  el.appendChild(probe)
  const color = getComputedStyle(probe).color
  probe.remove()
  return color && color !== 'rgba(0, 0, 0, 0)' ? color : fallback
}

export function readArticleTheme(el: HTMLElement): ArticleTheme {
  const styles = getComputedStyle(el)
  const fallback = styles.color || '#f5f5f5'
  return {
    foreground: cssVarColor(el, '--foreground', fallback),
    muted: cssVarColor(el, '--muted-foreground', fallback),
    primary: cssVarColor(el, '--primary', fallback),
    secondary: cssVarColor(el, '--secondary', 'transparent'),
    border: cssVarColor(el, '--border', fallback),
    background: cssVarColor(el, '--background', 'transparent'),
    card: cssVarColor(el, '--card', 'transparent'),
    fontSans: pickFontFamily(styles.getPropertyValue('--font-sans'), 'Sora'),
    fontDisplay: pickFontFamily(styles.getPropertyValue('--font-display'), 'Fraunces'),
    fontMono: pickFontFamily(styles.getPropertyValue('--font-mono'), 'JetBrains Mono'),
  }
}

export function buildMetrics(width: number, theme: ArticleTheme): ArticleMetrics {
  const scale = Math.min(1, Math.max(0.86, width / 680))
  const bodySize = Math.round(17 * scale)
  const bodyLine = Math.round(32 * scale)
  const h2Size = Math.round(26 * scale)
  const h3Size = Math.round(20 * scale)
  const h4Size = Math.round(17 * scale)
  const codeSize = Math.max(12, Math.round(13.5 * scale))

  return {
    width,
    bodySize,
    bodyLine,
    h2Size,
    h2Line: Math.round(36 * scale),
    h3Size,
    h3Line: Math.round(30 * scale),
    h4Size,
    h4Line: Math.round(28 * scale),
    codeSize,
    codeLine: Math.round(22 * scale),
    bodyFont: canvasFont(theme.fontSans, bodySize),
    h2Font: canvasFont(theme.fontDisplay, h2Size, { weight: 600, generic: 'serif' }),
    h3Font: canvasFont(theme.fontDisplay, h3Size, { weight: 600, generic: 'serif' }),
    h4Font: canvasFont(theme.fontSans, h4Size, { weight: 600 }),
    codeFont: canvasFont(theme.fontMono, codeSize, { generic: 'monospace' }),
    inlineCodeFont: canvasFont(theme.fontMono, Math.max(12, bodySize - 2), { generic: 'monospace' }),
  }
}

export function flowFontFor(
  span: { strong: boolean; em: boolean; code: boolean },
  family: string,
  metrics: ArticleMetrics,
) {
  if (span.code) return metrics.inlineCodeFont
  return canvasFont(family, metrics.bodySize, {
    weight: span.strong ? '600' : '400',
    style: span.em ? 'italic' : '',
  })
}
