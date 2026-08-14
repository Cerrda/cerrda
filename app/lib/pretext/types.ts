export type ArticleSpan = {
  text: string
  strong: boolean
  em: boolean
  code: boolean
  href?: string
}

export type ArticleBlock =
  | { type: 'heading'; level: 1 | 2 | 3 | 4; spans: ArticleSpan[] }
  | { type: 'paragraph'; spans: ArticleSpan[] }
  | { type: 'blockquote'; spans: ArticleSpan[] }
  | { type: 'list'; ordered: boolean; items: ArticleSpan[][] }
  | { type: 'code'; lang: string; text: string }
  | { type: 'table'; id: string; html: string }
  | { type: 'image'; id: string; src: string; alt: string }
  | { type: 'hr' }

export type OverlaySpec = {
  id: string
  type: 'table' | 'image'
  html?: string
  src?: string
  alt?: string
}

export type FlowItem = {
  text: string
  font: string
  extraWidth: number
  break: 'normal' | 'never'
  color: string
  href?: string
  code: boolean
}

export type HorzRange = {
  left: number
  right: number
}

export type CircleExclusion = {
  x: number
  y: number
  radius: number
}

export type LinkHit = {
  x: number
  y: number
  w: number
  h: number
  href: string
}

export type ArticleTheme = {
  foreground: string
  muted: string
  primary: string
  secondary: string
  border: string
  background: string
  card: string
  fontSans: string
  fontDisplay: string
  fontMono: string
}

export type ArticleMetrics = {
  width: number
  bodySize: number
  bodyLine: number
  h2Size: number
  h2Line: number
  h3Size: number
  h3Line: number
  h4Size: number
  h4Line: number
  codeSize: number
  codeLine: number
  bodyFont: string
  h2Font: string
  h3Font: string
  h4Font: string
  codeFont: string
  inlineCodeFont: string
}
