#!/usr/bin/env node
/**
 * Sync Juejin articles, GitHub/skills.sh skills, and npm packages
 * into this site's static data files.
 *
 * Usage (from repo root):
 *   node .cursor/skills/sync-homepage/scripts/sync-homepage.mjs
 *   node .cursor/skills/sync-homepage/scripts/sync-homepage.mjs --dry-run
 *   node .cursor/skills/sync-homepage/scripts/sync-homepage.mjs --only=articles,skills,packages
 */
import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const skillDir = path.dirname(fileURLToPath(import.meta.url))

function findRepoRoot(start) {
  let dir = start
  while (true) {
    if (fs.existsSync(path.join(dir, 'nuxt.config.ts')) && fs.existsSync(path.join(dir, 'app/data'))) {
      return dir
    }
    const parent = path.dirname(dir)
    if (parent === dir) {
      throw new Error('cannot find repo root from skill script')
    }
    dir = parent
  }
}

const root = findRepoRoot(skillDir)
const args = process.argv.slice(2)
const dryRun = args.includes('--dry-run')
const onlyArg = args.find((a) => a.startsWith('--only='))
const only = new Set(
  (onlyArg ? onlyArg.slice(7) : 'articles,skills,packages')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean),
)

const sourcesPath = path.join(skillDir, 'homepage-sources.json')
const articlesPath = path.join(root, 'app/data/articles.json')
const packagesPath = path.join(root, 'app/data/packages.json')
const skillsPath = path.join(root, 'app/data/skills.json')
const mdDir = path.join(root, 'content/articles')
const rawDir = path.join(root, 'content/_raw')

const JUEJIN_HEADERS = {
  'Content-Type': 'application/json',
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
  'Origin': 'https://juejin.cn',
  'Referer': 'https://juejin.cn/',
}

const report = {
  ok: true,
  dryRun,
  sources: [...only],
  articles: {
    added: [],
    updatedBody: [],
    unchanged: [],
    slugNeedsReview: [],
    errors: [],
  },
  skills: { added: [], updated: [], unchanged: [], errors: [] },
  packages: {
    added: [],
    versionBumps: [],
    unchanged: [],
    discovered: [],
    errors: [],
  },
  copyQueue: [],
  generatedHtml: false,
}

function readJson(file, fallback) {
  if (!fs.existsSync(file)) return fallback
  return JSON.parse(fs.readFileSync(file, 'utf8'))
}

function writeJson(file, data) {
  const text = `${JSON.stringify(data, null, 2)}\n`
  if (dryRun) return
  fs.mkdirSync(path.dirname(file), { recursive: true })
  fs.writeFileSync(file, text, 'utf8')
}

function yamlQuote(s) {
  return `"${String(s).replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`
}

function parseExistingFm(raw) {
  const m = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/)
  if (!m) return null
  const fm = m[1]
  const get = (key) => {
    const hit = fm.match(new RegExp(`^${key}:\\s*(.*)$`, 'm'))
    return hit ? hit[1].trim() : ''
  }
  const tagsMatch = fm.match(/^tags:\s*(\[[\s\S]*?\])/m)
  return {
    title: get('title').replace(/^"|"$/g, ''),
    description: get('description').replace(/^"|"$/g, ''),
    date: get('date'),
    tags: tagsMatch ? tagsMatch[1] : '[]',
    juejin: get('juejin'),
    slug: get('slug'),
  }
}

function stripEmbeddedFm(mark) {
  const m = mark.match(/^---\r?\n[\s\S]*?\r?\n---\r?\n([\s\S]*)$/)
  return `${(m ? m[1] : mark).trim()}\n`
}

function draftSlug(title, id) {
  const ascii = (title.toLowerCase().match(/[a-z0-9]+/g) || []).filter((w) => w.length >= 2)
  if (ascii.join('-').length >= 8) return ascii.slice(0, 6).join('-')
  return `post-${String(id).slice(-8)}`
}

function sha256(text) {
  return crypto.createHash('sha256').update(String(text)).digest('hex').slice(0, 16)
}

function clip(text, max = 1600) {
  const s = String(text || '')
    .replace(/\s+/g, ' ')
    .trim()
  if (s.length <= max) return s
  return `${s.slice(0, max)}…`
}

function parseSkillFrontmatter(raw) {
  const m = raw.match(/^---\r?\n([\s\S]*?)\r?\n---/)
  if (!m) return { name: '', description: '' }
  const block = m[1]
  const name = (block.match(/^name:\s*(.+)$/m) || [])[1]?.trim() || ''
  let description = ''
  const folded = block.match(/^description:\s*[>|]-?\n((?:[ \t]+.*\n?)*)/m)
  if (folded) {
    description = folded[1]
      .split('\n')
      .map((l) => l.replace(/^\s+/, ''))
      .join(' ')
      .trim()
  } else {
    description = (block.match(/^description:\s*(.+)$/m) || [])[1]?.trim() || ''
  }
  return { name, description: description.replace(/^["']|["']$/g, '') }
}

function queueCopy(item) {
  report.copyQueue.push(item)
}

async function juejinJson(url, body) {
  const r = await fetch(url, {
    method: 'POST',
    headers: JUEJIN_HEADERS,
    body: JSON.stringify(body),
  })
  const j = await r.json()
  if (j.err_no !== 0) {
    throw new Error(j.err_msg || `juejin ${r.status}`)
  }
  return j
}

async function fetchJuejinList(userId) {
  const items = []
  let cursor = '0'
  for (let i = 0; i < 20; i++) {
    const j = await juejinJson('https://api.juejin.cn/content_api/v1/article/query_list', {
      user_id: String(userId),
      cursor,
      sort_type: 2,
    })
    items.push(...(j.data || []))
    if (!j.has_more) break
    cursor = j.cursor || '0'
  }
  return items
}

async function fetchJuejinArticle(id) {
  const j = await juejinJson('https://api.juejin.cn/content_api/v1/article/detail', {
    article_id: String(id),
    client_type: 2608,
  })
  if (!j.data?.article_info) throw new Error(`no article_info for ${id}`)
  return j.data
}

function parseFmTags(tagStr, fallback) {
  if (!tagStr) return fallback
  try {
    const parsed = JSON.parse(tagStr)
    if (Array.isArray(parsed) && parsed.length) return parsed
  } catch {
    /* keep fallback */
  }
  return fallback
}

function writeArticleMarkdown({ slug, id, info, existingRaw, localArticle, isNew }) {
  const oldFm = existingRaw ? parseExistingFm(existingRaw) : null
  const mark = info.mark_content || ''
  if (!mark || mark.length < 50) {
    throw new Error(`empty mark_content for ${slug}`)
  }
  const body = stripEmbeddedFm(mark)
  const date = localArticle?.date || oldFm?.date || new Date(Number(info.ctime) * 1000).toISOString().slice(0, 10)
  const title = isNew ? (info.title || '').trim() : (localArticle?.title || oldFm?.title || info.title || '').trim()
  const description = isNew ? '' : (localArticle?.description || oldFm?.description || '').trim()
  const finalTags = isNew ? [] : (localArticle?.tags?.length ? localArticle.tags : null) || parseFmTags(oldFm?.tags, [])
  const tagStr = JSON.stringify(finalTags)
  const juejin = oldFm?.juejin || `https://juejin.cn/post/${id}`
  const slugVal = localArticle?.slug || oldFm?.slug || slug
  const content =
    '---\n' +
    `title: ${yamlQuote(title)}\n` +
    `description: ${yamlQuote(description)}\n` +
    `date: ${date}\n` +
    `tags: ${tagStr}\n` +
    `juejin: ${juejin}\n` +
    `slug: ${slugVal}\n` +
    '---\n\n' +
    body

  const mdPath = path.join(mdDir, `${slugVal}.md`)
  const previous = fs.existsSync(mdPath) ? fs.readFileSync(mdPath, 'utf8') : ''
  const previousBody = previous ? stripEmbeddedFm(previous).trim() : ''
  const bodyChanged = previousBody !== body.trim()

  if (!dryRun && bodyChanged) {
    fs.mkdirSync(mdDir, { recursive: true })
    fs.mkdirSync(rawDir, { recursive: true })
    fs.writeFileSync(mdPath, content, 'utf8')
    fs.writeFileSync(
      path.join(rawDir, `${id}.extract.json`),
      JSON.stringify(
        {
          slug: slugVal,
          title: info.title,
          brief: info.brief_content,
          tags: finalTags,
          mark_content: mark,
        },
        null,
        2,
      ),
      'utf8',
    )
  }

  return {
    meta: {
      slug: slugVal,
      id: String(id),
      title,
      description,
      date,
      tags: finalTags,
    },
    bodyChanged,
  }
}

async function syncArticles(sources) {
  const local = readJson(articlesPath, [])
  const byId = new Map(local.map((a) => [String(a.id), a]))
  const slugById = { ...sources.articleSlugs }
  const usedSlugs = new Set(Object.values(slugById))
  const remoteList = await fetchJuejinList(sources.juejinUserId)
  const next = []

  for (const item of remoteList) {
    const id = String(item.article_id || item.article_info?.article_id)
    const infoLite = item.article_info || {}
    const tags = (item.tags || []).map((t) => t.tag_name).filter(Boolean)
    let slug = slugById[id]
    let slugNeedsReview = false
    if (!slug) {
      slug = draftSlug(infoLite.title || '', id)
      while (usedSlugs.has(slug)) slug = `${slug}-${id.slice(-4)}`
      slugNeedsReview = slug.startsWith('post-') || slug.length < 6
      slugById[id] = slug
      usedSlugs.add(slug)
    }

    const mdPath = path.join(mdDir, `${slug}.md`)
    const existingRaw = fs.existsSync(mdPath) ? fs.readFileSync(mdPath, 'utf8') : ''
    const isNew = !byId.has(id) || !existingRaw

    try {
      const data = await fetchJuejinArticle(id)
      const { meta, bodyChanged } = writeArticleMarkdown({
        slug,
        id,
        info: data.article_info,
        existingRaw,
        localArticle: byId.get(id),
        isNew,
      })
      next.push(meta)
      const remote = {
        title: data.article_info.title,
        brief: data.article_info.brief_content,
        tags: tags.length ? tags : (data.tags || []).map((t) => t.tag_name),
        date: new Date(Number(data.article_info.ctime) * 1000).toISOString().slice(0, 10),
      }
      if (isNew) {
        report.articles.added.push({ id, slug, title: meta.title })
        queueCopy({
          kind: 'article',
          reason: 'added',
          id,
          slug,
          sourceFile: `content/articles/${slug}.md`,
          remote,
          local: null,
        })
      } else if (bodyChanged) {
        report.articles.updatedBody.push({ id, slug })
        queueCopy({
          kind: 'article',
          reason: 'updatedBody',
          id,
          slug,
          sourceFile: `content/articles/${slug}.md`,
          remote,
          local: {
            title: meta.title,
            description: meta.description,
            tags: meta.tags,
          },
        })
      } else {
        report.articles.unchanged.push({ id, slug })
      }
      if (slugNeedsReview) {
        report.articles.slugNeedsReview.push({ id, slug, title: meta.title })
      }
    } catch (err) {
      report.ok = false
      report.articles.errors.push({ id, slug, error: String(err.message || err) })
      if (byId.has(id)) next.push(byId.get(id))
    }
  }

  const remoteIds = new Set(remoteList.map((item) => String(item.article_id)))
  for (const localArticle of local) {
    if (!remoteIds.has(String(localArticle.id))) next.push(localArticle)
  }

  sources.articleSlugs = slugById
  writeJson(articlesPath, next)
  return next.length > 0 && (report.articles.added.length || report.articles.updatedBody.length)
}

async function githubJson(url) {
  let lastErr
  for (let i = 0; i < 3; i++) {
    try {
      const r = await fetch(url, {
        headers: {
          'Accept': 'application/vnd.github+json',
          'User-Agent': 'cerrda-homepage-sync',
        },
      })
      if (!r.ok) throw new Error(`GitHub ${r.status} ${url}`)
      return await r.json()
    } catch (err) {
      lastErr = err
      await new Promise((resolve) => setTimeout(resolve, 400 * (i + 1)))
    }
  }
  throw lastErr
}

async function syncSkills(sources) {
  const local = readJson(skillsPath, [])
  const byName = new Map(local.map((s) => [s.name, s]))
  const repo = sources.githubSkillsRepo
  const profile = sources.skillsShProfile
  const hashes = { ...(sources.skillHashes || {}) }
  const tree = await githubJson(`https://api.github.com/repos/${repo}/git/trees/main?recursive=1`)
  const skillFiles = (tree.tree || []).filter((t) => t.type === 'blob' && /^[^/]+\/SKILL\.md$/.test(t.path))

  const next = []
  for (const file of skillFiles) {
    const name = file.path.split('/')[0]
    const fileJson = await githubJson(`https://api.github.com/repos/${repo}/contents/${file.path}`)
    const raw = Buffer.from(fileJson.content.replace(/\s/g, ''), 'base64').toString('utf8')
    const fm = parseSkillFrontmatter(raw)
    const hash = sha256(raw)
    const existing = byName.get(name)
    const skill = existing
      ? { ...existing }
      : {
          name,
          href: `https://skills.sh/${profile}/skills/${name}`,
          install: `npx skills add https://github.com/${repo} --skill ${name}`,
          summary: '',
          points: [],
        }
    const remote = {
      description: fm.description,
      excerpt: clip(raw.replace(/^---[\s\S]*?---\s*/, ''), 1800),
    }

    if (!existing) {
      report.skills.added.push(name)
      queueCopy({
        kind: 'skill',
        reason: 'added',
        name,
        remote,
        local: null,
      })
    } else if (hashes[name] && hashes[name] !== hash) {
      report.skills.updated.push(name)
      queueCopy({
        kind: 'skill',
        reason: 'skillUpdated',
        name,
        remote,
        local: { summary: existing.summary, points: existing.points },
      })
    } else {
      report.skills.unchanged.push(name)
    }
    hashes[name] = hash
    next.push(skill)
  }

  const remoteNames = new Set(next.map((s) => s.name))
  for (const localSkill of local) {
    if (!remoteNames.has(localSkill.name)) next.push(localSkill)
  }

  sources.skillHashes = hashes
  writeJson(skillsPath, next)
}

async function fetchNpmLatest(name) {
  const r = await fetch(`https://registry.npmjs.org/${encodeURIComponent(name)}/latest`, {
    headers: { 'User-Agent': 'cerrda-homepage-sync' },
  })
  if (!r.ok) throw new Error(`npm ${r.status} ${name}`)
  return r.json()
}

async function fetchMaintainerPackages(maintainer) {
  const r = await fetch(
    `https://registry.npmjs.org/-/v1/search?text=maintainer:${encodeURIComponent(maintainer)}&size=20`,
    { headers: { 'User-Agent': 'cerrda-homepage-sync' } },
  )
  if (!r.ok) throw new Error(`npm search ${r.status}`)
  const j = await r.json()
  return (j.objects || []).map((o) => o.package)
}

function readmeExcerpt(readme) {
  return clip(readme, 1800)
}

async function syncPackages(sources) {
  const local = readJson(packagesPath, [])
  const byName = new Map(local.map((p) => [p.name, p]))
  const exclude = new Set(sources.npm?.exclude || [])
  const pinned = [...(sources.npm?.pinned || [])]
  const pinnedNames = new Set(pinned.map((p) => p.name))

  let discovered = []
  try {
    discovered = await fetchMaintainerPackages(sources.npmMaintainer)
  } catch (err) {
    report.packages.errors.push(String(err.message || err))
  }

  for (const pkg of discovered) {
    if (exclude.has(pkg.name) || pinnedNames.has(pkg.name)) continue
    pinned.push({ name: pkg.name, role: '作者' })
    pinnedNames.add(pkg.name)
    report.packages.discovered.push(pkg.name)
  }

  const next = []
  const seen = new Set()

  for (const pin of pinned) {
    if (exclude.has(pin.name) || seen.has(pin.name)) continue
    seen.add(pin.name)
    try {
      const latest = await fetchNpmLatest(pin.name)
      const existing = byName.get(pin.name)
      const version = String(latest.version || existing?.version || '').replace(/^v/, '')
      const pkg = existing
        ? { ...existing, version, role: existing.role || pin.role }
        : {
            name: pin.name,
            role: pin.role || '作者',
            href: `https://npmx.dev/package/${pin.name}`,
            npm: `https://www.npmjs.com/package/${pin.name}`,
            version,
            summary: '',
            points: [],
          }
      const remote = {
        version,
        description: latest.description || '',
        keywords: latest.keywords || [],
        excerpt: readmeExcerpt(latest.readme),
      }

      if (!existing) {
        report.packages.added.push(pin.name)
        queueCopy({
          kind: 'package',
          reason: 'added',
          name: pin.name,
          remote,
          local: null,
        })
      } else if (existing.version !== version) {
        report.packages.versionBumps.push({
          name: pin.name,
          from: existing.version,
          to: version,
        })
        queueCopy({
          kind: 'package',
          reason: 'versionBump',
          name: pin.name,
          remote,
          local: { summary: existing.summary, points: existing.points, version: existing.version },
        })
      } else {
        report.packages.unchanged.push(pin.name)
      }
      next.push(pkg)
    } catch (err) {
      report.ok = false
      report.packages.errors.push({ name: pin.name, error: String(err.message || err) })
      if (byName.has(pin.name)) next.push(byName.get(pin.name))
    }
  }

  sources.npm.pinned = pinned
  writeJson(packagesPath, next)
}

function generateArticlesHtml() {
  const r = spawnSync(process.execPath, ['scripts/generate-articles.mjs'], {
    cwd: root,
    stdio: 'inherit',
  })
  if (r.status !== 0) {
    report.ok = false
    report.articles.errors.push({ error: `generate-articles exited ${r.status}` })
    return
  }
  report.generatedHtml = true
}

const sources = readJson(sourcesPath, {})

try {
  if (only.has('articles')) {
    const changed = await syncArticles(sources)
    if (changed && !dryRun) generateArticlesHtml()
  }
} catch (err) {
  report.ok = false
  report.articles.errors.push({ error: String(err.message || err) })
}

try {
  if (only.has('skills')) await syncSkills(sources)
} catch (err) {
  report.ok = false
  report.skills.errors.push(String(err.message || err))
}

try {
  if (only.has('packages')) await syncPackages(sources)
} catch (err) {
  report.ok = false
  report.packages.errors.push(String(err.message || err))
}

writeJson(sourcesPath, sources)
writeJson(path.join(rawDir, 'sync-report.json'), report)
writeJson(path.join(rawDir, 'sync-copy-brief.json'), report.copyQueue)
console.log(JSON.stringify(report, null, 2))
if (!report.ok) process.exitCode = 1
