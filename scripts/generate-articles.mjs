import fs from 'node:fs'
import path from 'node:path'
import { marked } from 'marked'

const dir = path.resolve('content/articles')
const outDir = path.resolve('public/articles')
const assetRoot = path.resolve('public/articles/assets')
const articlesMetaPath = path.resolve('app/data/articles.json')

const GITHUB_JUEJIN_ASSETS =
  'https://raw.githubusercontent.com/Cerrda/dsh-cerrda-theme/main/docs/juejin/assets/'
const GITHUB_ASSET_SLUGS = new Set(['dsh-cerrda-theme', 'deepseek-harness-dsh'])

const JUEJIN_HEADERS = {
  'Content-Type': 'application/json',
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
  Origin: 'https://juejin.cn',
  Referer: 'https://juejin.cn/',
}

const IMAGE_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36',
  Referer: 'https://juejin.cn/',
  Origin: 'https://juejin.cn',
  Accept: 'image/avif,image/webp,image/apng,image/*,*/*;q=0.8',
}

const FILE_NAME_RE = /^[\w.-]+\.(png|jpe?g|gif|webp|svg|avif)$/i

function extractBody(raw) {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/)
  return match ? { frontmatter: match[1], body: match[2].trim() } : { frontmatter: '', body: raw }
}

function juejinIdFrom(frontmatter, slug, metaBySlug) {
  const fromFm = frontmatter.match(/juejin:\s*\S*?(\d{15,})/)
  if (fromFm) return fromFm[1]
  return metaBySlug.get(slug)?.id ? String(metaBySlug.get(slug).id) : ''
}

function objectIdFromUrl(src) {
  const match = String(src).match(/\/([a-f0-9]{16,40})(?:~|$|\?)/i)
  return match?.[1] || ''
}

function collectImages(text) {
  const out = []
  const seen = new Set()
  const add = (src, alt = '') => {
    const key = decodeHtml(String(src || '').trim())
    if (!key || seen.has(key)) return
    seen.add(key)
    out.push({ src: key, alt: decodeHtml(alt) })
  }
  for (const match of text.matchAll(/!\[([^\]]*)\]\(([^)]+)\)/g)) add(match[2], match[1])
  for (const match of text.matchAll(/<img\b([^>]*)>/gi)) {
    const src = match[1].match(/\bsrc=["']([^"']+)["']/i)?.[1]
    const alt = match[1].match(/\balt=["']([^"']*)["']/i)?.[1] || ''
    if (src) add(src, alt)
  }
  return out
}

function decodeHtml(value) {
  return String(value || '')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
}

function pickFilename(src, alt, index) {
  const altName = String(alt || '').trim()
  if (FILE_NAME_RE.test(altName)) return altName
  const base = path.basename(String(src).split('?')[0])
  if (FILE_NAME_RE.test(base)) return base
  const id = objectIdFromUrl(src) || `img-${index + 1}`
  return `${id}.webp`
}

function isImageBuffer(buf) {
  if (!buf || buf.length < 12) return false
  if (buf[0] === 0xff && buf[1] === 0xd8) return true
  if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) return true
  if (buf[0] === 0x47 && buf[1] === 0x49 && buf[2] === 0x46) return true
  if (buf[0] === 0x52 && buf[1] === 0x49 && buf[2] === 0x46 && buf[3] === 0x46) return true
  return false
}

function findCachedAsset(name) {
  if (!name || !fs.existsSync(assetRoot)) return ''
  for (const slug of fs.readdirSync(assetRoot)) {
    const candidate = path.join(assetRoot, slug, name)
    if (fs.existsSync(candidate) && fs.statSync(candidate).size > 100) return candidate
  }
  return ''
}

async function writeImage(dest, buf) {
  if (!isImageBuffer(buf)) return false
  fs.mkdirSync(path.dirname(dest), { recursive: true })
  fs.writeFileSync(dest, buf)
  return true
}

async function downloadGithubAsset(filename, dest) {
  if (!FILE_NAME_RE.test(filename)) return false
  const url = `https://api.github.com/repos/Cerrda/dsh-cerrda-theme/contents/docs/juejin/assets/${encodeURIComponent(filename)}`
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'cerrda-article-assets',
        Accept: 'application/vnd.github.raw',
      },
    })
    if (!res.ok) return false
    const buf = Buffer.from(await res.arrayBuffer())
    if (await writeImage(dest, buf)) return true
    try {
      const json = JSON.parse(buf.toString('utf8'))
      if (json.content) {
        return await writeImage(dest, Buffer.from(String(json.content).replace(/\s/g, ''), 'base64'))
      }
    } catch {
      /* not json */
    }
    return false
  } catch {
    return false
  }
}

async function downloadImage(url, dest) {
  if (!/^https?:/i.test(url)) return false
  const github = /githubusercontent\.com|github\.com/i.test(url)
  try {
    const res = await fetch(url, {
      headers: github ? { 'User-Agent': 'cerrda-article-assets' } : IMAGE_HEADERS,
      redirect: 'follow',
      signal: AbortSignal.timeout(20000),
    })
    if (!res.ok) return false
    return await writeImage(dest, Buffer.from(await res.arrayBuffer()))
  } catch {
    return false
  }
}

async function fetchJuejinImageIndex(articleId) {
  const map = new Map()
  if (!articleId) return map
  try {
    const res = await fetch('https://api.juejin.cn/content_api/v1/article/detail', {
      method: 'POST',
      headers: JUEJIN_HEADERS,
      body: JSON.stringify({ article_id: String(articleId), client_type: 2608 }),
    })
    const json = await res.json()
    const mark = json.data?.article_info?.mark_content || ''
    for (const img of collectImages(mark)) {
      if (img.alt) map.set(img.alt, img.src)
      const id = objectIdFromUrl(img.src)
      if (id) map.set(id, img.src)
      const base = path.basename(img.src.split('?')[0])
      if (base) map.set(base, img.src)
    }
  } catch (error) {
    console.warn('juejin refresh failed', articleId, error.message || error)
  }
  return map
}

function replaceSrc(html, from, to) {
  const variants = [...new Set([from, from.replace(/&/g, '&amp;')])]
  let out = html
  for (const variant of variants) {
    out = out.split(`src="${variant}"`).join(`src="${to}"`)
    out = out.split(`src='${variant}'`).join(`src='${to}'`)
  }
  return out
}

function decorateImages(html) {
  return html.replace(/<img\b([^>]*)>/gi, (full, attrs) => {
    let next = attrs
    if (!/\breferrerpolicy=/i.test(next)) next += ' referrerpolicy="no-referrer"'
    if (!/\bloading=/i.test(next)) next += ' loading="lazy"'
    if (!/\bdecoding=/i.test(next)) next += ' decoding="async"'
    return `<img${next}>`
  })
}

async function localizeImages({ slug, body, html, articleId, freshMap }) {
  const images = collectImages(`${body}\n${html}`)
  if (!images.length) return html

  const destDir = path.join(assetRoot, slug)
  fs.mkdirSync(destDir, { recursive: true })
  let out = html

  for (const [index, img] of images.entries()) {
    const name = pickFilename(img.src, img.alt, index)
    const dest = path.join(destDir, name)
    const publicPath = `/articles/assets/${slug}/${name}`
    const cached = fs.existsSync(dest) && fs.statSync(dest).size > 100

    if (!cached) {
      const candidates = []
      const localName = FILE_NAME_RE.test(name) ? name : path.basename(img.src.split('?')[0])
      const localTries = [
        path.join(dir, slug, 'assets', localName),
        path.join(dir, slug, localName),
        path.resolve(dir, img.src),
        findCachedAsset(localName),
        findCachedAsset(name),
      ]
      let copied = false
      for (const local of localTries) {
        if (local && fs.existsSync(local) && fs.statSync(local).isFile()) {
          fs.copyFileSync(local, dest)
          copied = true
          break
        }
      }

      if (!copied && GITHUB_ASSET_SLUGS.has(slug) && FILE_NAME_RE.test(localName)) {
        copied = await downloadGithubAsset(localName, dest)
      }

      if (!copied) {
        if (GITHUB_ASSET_SLUGS.has(slug) && FILE_NAME_RE.test(localName)) {
          candidates.push(`${GITHUB_JUEJIN_ASSETS}${localName}`)
        }
        if (/^https?:/i.test(img.src)) candidates.push(img.src)
        const id = objectIdFromUrl(img.src)
        if (id && freshMap.get(id)) candidates.push(freshMap.get(id))
        if (img.alt && freshMap.get(img.alt)) candidates.push(freshMap.get(img.alt))
        if (localName && freshMap.get(localName)) candidates.push(freshMap.get(localName))

        let ok = false
        for (const url of [...new Set(candidates)]) {
          if (await downloadImage(url, dest)) {
            ok = true
            break
          }
        }
        if (!ok) {
          console.warn('image miss', slug, img.src.slice(0, 96))
          continue
        }
      }
    }

    out = replaceSrc(out, img.src, publicPath)
    console.log('asset', slug, name)
  }

  return decorateImages(out)
}

function loadMetaBySlug() {
  if (!fs.existsSync(articlesMetaPath)) return new Map()
  const list = JSON.parse(fs.readFileSync(articlesMetaPath, 'utf8'))
  return new Map(list.map((item) => [item.slug, item]))
}

async function main() {
  const files = fs.readdirSync(dir).filter((file) => file.endsWith('.md'))
  const metaBySlug = loadMetaBySlug()
  const freshCache = new Map()
  fs.mkdirSync(outDir, { recursive: true })

  for (const file of files) {
    let text = fs.readFileSync(path.join(dir, file), 'utf8')
    text = text.replace(/(^|\n)``([a-zA-Z]+)\n/g, '$1```$2\n').replace(/(^|\n)``\n/g, '$1```\n')
    const { frontmatter, body } = extractBody(text)
    const slug = file.replace(/\.md$/, '')
    const articleId = juejinIdFrom(frontmatter, slug, metaBySlug)
    if (articleId && !freshCache.has(articleId)) {
      freshCache.set(articleId, await fetchJuejinImageIndex(articleId))
    }
    const html = String(marked.parse(body, { async: false }))
    const localized = await localizeImages({
      slug,
      body,
      html,
      articleId,
      freshMap: freshCache.get(articleId) || new Map(),
    })
    fs.writeFileSync(path.join(outDir, `${slug}.html`), localized)
    console.log('ok', slug)
  }

  console.log(`generated ${files.length} html files`)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
