import fs from "node:fs";
import path from "node:path";
import { marked } from "marked";

const dir = path.resolve("content/articles");
const outDir = path.resolve("public/articles");
const files = fs.readdirSync(dir).filter((f) => f.endsWith(".md"));

function extractBody(raw) {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  return match ? match[2].trim() : raw;
}

fs.mkdirSync(outDir, { recursive: true });

for (const file of files) {
  let raw = fs.readFileSync(path.join(dir, file));
  // try utf8 first; if replacement chars dominate, fall back
  let text = raw.toString("utf8");
  text = text
    .replace(/(^|\n)``([a-zA-Z]+)\n/g, "$1```$2\n")
    .replace(/(^|\n)``\n/g, "$1```\n");
  const body = extractBody(text);
  const slug = file.replace(/\.md$/, "");
  const html = marked.parse(body, { async: false });
  fs.writeFileSync(path.join(outDir, `${slug}.html`), String(html));
  console.log("ok", slug);
}

console.log(`generated ${files.length} html files`);
