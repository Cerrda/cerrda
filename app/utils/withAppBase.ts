/**
 * Prefix a site-root path with Nuxt `app.baseURL`.
 * Required for GitHub Pages project sites (`/cerrda/editorial/...`).
 */
export function withAppBase(path: string, baseURL = '/'): string {
  if (!path) return baseURL || '/'
  if (/^(https?:|data:|blob:|mailto:)/i.test(path)) return path
  if (path.startsWith('#')) return path
  const base = baseURL === '/' ? '' : baseURL.replace(/\/$/, '')
  const normalized = path.startsWith('/') ? path : `/${path}`
  if (base && (normalized === base || normalized.startsWith(`${base}/`))) {
    return normalized
  }
  return `${base}${normalized}`
}

export function useAppAsset(path: MaybeRefOrGetter<string>) {
  const config = useRuntimeConfig()
  return computed(() => withAppBase(toValue(path), config.app.baseURL))
}
