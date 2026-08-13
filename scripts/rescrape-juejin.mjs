import fs from "node:fs";
import path from "node:path";

const articles = [
  { slug: "scrapling-config-crawl-skill", id: "7672698563611197490" },
  { slug: "faker-mock-setup-skill", id: "7672434949261197352" },
  { slug: "unocss-svg-hmr", id: "7653373167660204078" },
  { slug: "vue3-vcopy", id: "7650080459327373354" },
  { slug: "unocss-icons", id: "7650093760348848147" },
  { slug: "tooltip-perf", id: "7637342611919880228" },
  { slug: "v-ellipsis-tooltip", id: "7597704040216215578" },
  { slug: "uniapp-nav-bar", id: "7576843726010662938" },
  { slug: "fnm-windows", id: "7576276707330981894" },
];

function parseExistingFm(raw) {
  const m = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
  if (!m) return null;
  const fm = m[1];
  const get = (key) => {
    const hit = fm.match(new RegExp(`^${key}:\\s*(.*)$`, "m"));
    return hit ? hit[1].trim() : "";
  };
  const tagsMatch = fm.match(/^tags:\s*(\[[\s\S]*?\])/m);
  return {
    title: get("title").replace(/^"|"$/g, ""),
    description: get("description").replace(/^"|"$/g, ""),
    date: get("date"),
    tags: tagsMatch ? tagsMatch[1] : "[]",
    juejin: get("juejin"),
    slug: get("slug"),
  };
}

function stripEmbeddedFm(mark) {
  const m = mark.match(/^---\r?\n[\s\S]*?\r?\n---\r?\n([\s\S]*)$/);
  return (m ? m[1] : mark).trim() + "\n";
}

function yamlQuote(s) {
  return `"${String(s).replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
}

async function fetchArticle(id) {
  const r = await fetch("https://api.juejin.cn/content_api/v1/article/detail", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      Origin: "https://juejin.cn",
      Referer: "https://juejin.cn/",
    },
    body: JSON.stringify({ article_id: id, client_type: 2608 }),
  });
  const j = await r.json();
  if (j.err_no !== 0 || !j.data?.article_info) {
    throw new Error(`API fail ${id}: ${j.err_msg || r.status}`);
  }
  return j.data;
}

const outDir = path.resolve("content/articles");
fs.mkdirSync(path.resolve("content/_raw"), { recursive: true });
const results = [];

for (const { slug, id } of articles) {
  const filePath = path.join(outDir, `${slug}.md`);
  const existing = fs.existsSync(filePath)
    ? fs.readFileSync(filePath, "utf8")
    : "";
  const oldFm = existing ? parseExistingFm(existing) : null;

  const data = await fetchArticle(id);
  const info = data.article_info;
  const mark = info.mark_content || "";
  if (!mark || mark.length < 50) {
    throw new Error(`empty mark_content for ${slug}`);
  }

  // keep raw for debugging
  fs.writeFileSync(
    path.resolve("content/_raw", `${id}.extract.json`),
    JSON.stringify(
      {
        slug,
        title: info.title,
        brief: info.brief_content,
        tags: (data.tags || []).map((t) => t.tag_name),
        mark_content: mark,
      },
      null,
      2,
    ),
    "utf8",
  );

  const body = stripEmbeddedFm(mark);
  const title = (oldFm?.title || info.title || "").trim();
  const description = (
    oldFm?.description ||
    info.brief_content ||
    ""
  ).trim();
  const date =
    oldFm?.date ||
    new Date(Number(info.ctime) * 1000).toISOString().slice(0, 10);
  const tags =
    oldFm?.tags ||
    JSON.stringify((data.tags || []).map((t) => t.tag_name));
  const juejin = oldFm?.juejin || `https://juejin.cn/post/${id}`;
  const slugVal = oldFm?.slug || slug;

  const content =
    "---\n" +
    `title: ${yamlQuote(title)}\n` +
    `description: ${yamlQuote(description)}\n` +
    `date: ${date}\n` +
    `tags: ${tags}\n` +
    `juejin: ${juejin}\n` +
    `slug: ${slugVal}\n` +
    "---\n\n" +
    body;

  fs.writeFileSync(filePath, content, "utf8");

  const verify = fs.readFileSync(filePath, "utf8");
  const cn = (verify.match(/[\u4e00-\u9fff]/g) || []).length;
  const fffd = (verify.match(/\uFFFD/g) || []).length;
  const ok =
    verify.startsWith("---") &&
    cn > 50 &&
    fffd === 0 &&
    verify.includes(body.slice(0, Math.min(40, body.length)));
  const row = {
    slug,
    ok,
    bytes: Buffer.byteLength(content, "utf8"),
    cn,
    fffd,
    markLen: mark.length,
    bodyLen: body.length,
  };
  results.push(row);
  console.log(JSON.stringify(row));
}

fs.writeFileSync(
  path.resolve("content/_raw/rescrape-result.json"),
  JSON.stringify(results, null, 2),
  "utf8",
);
console.log(`DONE ${results.filter((r) => r.ok).length}/${results.length}`);
