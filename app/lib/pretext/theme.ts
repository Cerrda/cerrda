import type { ArticleMetrics, ArticleTheme } from './types'

function pickFontFamily(value: string, fallback: string) {
  const first = value
    .split(',')
    .map((part) => part.trim().replace(/^['"]|['"]$/g, ''))
    .find((part) => part && part !== 'ui-sans-serif' && part !== 'ui-serif' && part !== 'ui-monospace' && part !== 'system-ui')
  return first || fallback
}

export function readArticleTheme(el: HTMLElement): ArticleTheme {
  const styles = getComputedStyle(el)
  return {
    foreground: styles.getPropertyValue('--foreground').trim() || styles.color,
    muted: styles.getPropertyValue('--muted-foreground').trim() || styles.color,
    primary: styles.getPropertyValue('--primary').trim() || styles.color,
    secondary: styles.getPropertyValue('--secondary').trim() || 'transparent',
    border: styles.getPropertyValue('--border').trim() || styles.color,
    background: styles.getPropertyValue('--background').trim() || 'transparent',
    card: styles.getPropertyValue('--card').trim() || 'transparent',
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
  const quote = (name: string) => (name.includes(' ') ? `"${name}"` : name)

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
    bodyFont: `400 ${bodySize}px ${quote(theme.fontSans)}, sans-serif`,
    h2Font: `600 ${h2Size}px ${quote(theme.fontDisplay)}, serif`,
    h3Font: `600 ${h3Size}px ${quote(theme.fontDisplay)}, serif`,
    h4Font: `600 ${h4Size}px ${quote(theme.fontSans)}, sans-serif`,
    codeFont: `400 ${codeSize}px ${quote(theme.fontMono)}, monospace`,
    inlineCodeFont: `400 ${Math.max(12, bodySize - 2)}px ${quote(theme.fontMono)}, monospace`,
  }
}

export function flowFontFor(span: { strong: boolean; em: boolean; code: boolean }, base: string, metrics: ArticleMetrics) {
  if (span.code) return metrics.inlineCodeFont
  const weight = span.strong ? '600' : '400'
  const style = span.em ? 'italic ' : ''
  return `${style}${weight} ${metrics.bodySize}px ${base}`
}
