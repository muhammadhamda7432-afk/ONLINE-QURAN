import fs from "node:fs/promises";
import path from "node:path";
import { marked } from "marked";

const root = process.cwd();
const out = path.join(root, "dist");
const site = "https://mh-online-quran.vercel.app";
const today = new Date().toISOString().slice(0, 10);
const ignored = new Set([".git", "node_modules", "dist", "posts", "api", ".vercel"]);

await fs.rm(out, { recursive: true, force: true });
await fs.mkdir(out, { recursive: true });

async function copyPublic(from, to) {
  await fs.mkdir(to, { recursive: true });
  for (const item of await fs.readdir(from, { withFileTypes: true })) {
    if (ignored.has(item.name) || item.name === "build.mjs" || item.name === "package.json" || item.name === "package-lock.json") continue;
    const src = path.join(from, item.name);
    const dest = path.join(to, item.name);
    if (item.isDirectory()) await copyPublic(src, dest);
    else await fs.copyFile(src, dest);
  }
}
await copyPublic(root, out);

function parseFrontmatter(source) {
  const match = source.match(/^---\s*\r?\n([\s\S]*?)\r?\n---\s*\r?\n?([\s\S]*)$/);
  if (!match) return { meta: {}, body: source };
  const meta = {};
  for (const line of match[1].split(/\r?\n/)) {
    const m = line.match(/^([a-zA-Z0-9_-]+):\s*(.*)$/);
    if (!m) continue;
    let value = m[2].trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) value = value.slice(1, -1);
    if (value === '""' || value === "''") value = "";
    meta[m[1]] = value;
  }
  return { meta, body: match[2] };
}
const escapeHtml = (s = "") => String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const slugify = s => String(s || "").toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
const files = (await fs.readdir(path.join(root, "posts")).catch(() => [])).filter(f => f.endsWith(".md"));
const posts = [];
for (const file of files) {
  const source = await fs.readFile(path.join(root, "posts", file), "utf8");
  const { meta, body } = parseFrontmatter(source);
  const slug = slugify(meta.slug || file.replace(/\.md$/, ""));
  if (!slug || !meta.title) continue;
  const post = { ...meta, slug, body, file };
  posts.push(post);
}
posts.sort((a, b) => String(b.date || "").localeCompare(String(a.date || "")));

const oldBlogPath = path.join(out, "blog.html");
let blogTemplate = await fs.readFile(oldBlogPath, "utf8").catch(() => "");
const blogCards = posts.map(post => `
  <article class="card">
    ${post.image ? `<img src="${escapeHtml(post.image)}" alt="${escapeHtml(post.title)}" loading="lazy" style="width:100%;max-height:280px;object-fit:cover;border-radius:12px;margin-bottom:12px">` : ""}
    <h2><a href="/articles/${escapeHtml(post.slug)}.html">${escapeHtml(post.title)}</a></h2>
    <p>${escapeHtml(post.description || "")}</p>
    <p class="date">${escapeHtml(post.date || "")}</p>
    <a href="/articles/${escapeHtml(post.slug)}.html">Read article →</a>
  </article>`).join("\n");
const legacyCards = `
  <article class="card"><h2><a href="/best-online-quran-teacher.html">How to Choose the Best Online Quran Teacher</a></h2><p>What to check when selecting a qualified online Quran teacher for yourself or your child.</p><a href="/best-online-quran-teacher.html">Read article →</a></article>
  <article class="card"><h2><a href="/online-quran-classes-for-kids.html">Online Quran Classes for Kids</a></h2><p>How one-to-one online lessons can make Quran learning easier for children.</p><a href="/online-quran-classes-for-kids.html">Read article →</a></article>
  <article class="card"><h2><a href="/learn-quran-with-tajweed-online.html">Learn Quran with Tajweed Online</a></h2><p>Understand the benefits of Tajweed and regular recitation correction.</p><a href="/learn-quran-with-tajweed-online.html">Read article →</a></article>
  <article class="card"><h2><a href="/online-hifz-quran-classes.html">Online Hifz Quran Classes</a></h2><p>A structured approach to memorizing Quran online.</p><a href="/online-hifz-quran-classes.html">Read article →</a></article>
  <article class="card"><h2><a href="/noorani-qaida-online.html">Noorani Qaida Online</a></h2><p>A beginner-friendly guide to Arabic letters and Quran reading foundations.</p><a href="/noorani-qaida-online.html">Read article →</a></article>`;
const pageHeader = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Blog &amp; Articles | Quran Learning Tips | MH Online Quran Academy</title><meta name="description" content="Read practical Quran learning articles about Tajweed, Noorani Qaida, Hifz and online Quran classes for children and adults."><meta name="robots" content="index,follow"><link rel="canonical" href="${site}/blog.html"><meta property="og:title" content="Blog &amp; Articles | MH Online Quran Academy"><meta property="og:description" content="Helpful Quran learning guides for children and adults."><meta property="og:type" content="website"><meta property="og:url" content="${site}/blog.html"><script type="application/ld+json">{"@context":"https://schema.org","@type":"Blog","name":"Blog & Articles","url":"${site}/blog.html","publisher":{"@type":"EducationalOrganization","name":"MH Online Quran Academy","url":"${site}/"}}</script><style>body{font-family:Arial,sans-serif;max-width:1000px;margin:auto;padding:24px;line-height:1.8;background:#f8fbf8;color:#17352c}main{background:#fff;padding:clamp(20px,4vw,36px);border-radius:20px}h1,h2{color:#063b2c}.card{padding:20px;border:1px solid #dfeee7;border-radius:15px;margin:15px 0}.card a{color:#087f5b;font-weight:bold}.date{font-size:13px;color:#61756c}</style></head><body><main><a href="/">← MH Online Quran Academy</a><h1>Blog &amp; Articles</h1><p>Practical guides to help children and adults learn Quran online with better reading, Tajweed and consistent practice.</p>`;
const services = `<p><strong>Explore our classes:</strong> <a href="/online-quran-classes-pakistan.html">Pakistan</a> · <a href="/online-quran-classes-islamabad.html">Islamabad</a> · <a href="/online-quran-classes-usa.html">USA</a> · <a href="/online-quran-classes-uk.html">UK</a> · <a href="/online-quran-classes-portugal.html">Portugal</a> · <a href="/online-quran-classes-germany.html">Germany</a> · <a href="/online-quran-classes-canada.html">Canada</a></p><p><a href="/admin/">Admin: Publish a new article</a></p></main></body></html>`;
await fs.writeFile(oldBlogPath, pageHeader + (blogCards || "") + legacyCards + services, "utf8");

for (const post of posts) {
  const articlePath = path.join(out, "articles", post.slug + ".html");
  await fs.mkdir(path.dirname(articlePath), { recursive: true });
  const title = escapeHtml(post.title);
  const description = escapeHtml(post.description || post.title);
  const canonical = `${site}/articles/${post.slug}.html`;
  const articleHtml = marked.parse(post.body || "");
  const imageMeta = post.image ? `<meta property="og:image" content="${escapeHtml(post.image)}">` : "";
  const article = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title} | MH Online Quran Academy</title><meta name="description" content="${description}"><meta name="robots" content="index,follow"><link rel="canonical" href="${canonical}"><meta property="og:title" content="${title}"><meta property="og:description" content="${description}"><meta property="og:type" content="article"><meta property="og:url" content="${canonical}">${imageMeta}<script type="application/ld+json">${JSON.stringify({"@context":"https://schema.org","@type":"Article","headline":post.title,"description":post.description||post.title,"datePublished":post.date||today,"dateModified":post.date||today,"mainEntityOfPage":canonical,"author":{"@type":"Organization","name":"MH Online Quran Academy"},"publisher":{"@type":"Organization","name":"MH Online Quran Academy","url":site+"/"}})}</script><style>body{font-family:Arial,sans-serif;max-width:850px;margin:auto;padding:24px;line-height:1.85;background:#f8fbf8;color:#17352c}main{background:#fff;padding:clamp(20px,5vw,44px);border-radius:18px}h1,h2,h3{color:#063b2c;line-height:1.3}h1{font-size:clamp(30px,5vw,44px)}a{color:#087f5b}article img{max-width:100%;height:auto;border-radius:12px}article p,article li{margin:12px 0}.cta{padding:18px;background:#eef8f3;border-radius:12px;margin-top:28px}</style></head><body><main><a href="/blog.html">← All Blog &amp; Articles</a><article><h1>${title}</h1><p><small>Published: ${escapeHtml(post.date||"")}</small></p>${post.image ? `<img src="${escapeHtml(post.image)}" alt="${title}">` : ""}${articleHtml}<section class="cta"><h2>Learn Quran with MH Online Quran Academy</h2><p>Explore our online Quran classes for children and adults.</p><p><a href="/">Visit MH Online Quran Academy</a> · <a href="https://wa.me/923130017744">Contact us on WhatsApp</a></p></section></article></main></body></html>`;
  await fs.writeFile(articlePath, article, "utf8");
}

const sitemapPath = path.join(out, "sitemap.xml");
let sitemap = await fs.readFile(sitemapPath, "utf8").catch(() => `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></urlset>`);
sitemap = sitemap.replace(/\s*<url>\s*<loc>${site.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\/articles\/[^<]+<\/loc>[\s\S]*?<\/url>/g, "");
for (const post of posts) {
  const url = `${site}/articles/${post.slug}.html`;
  if (sitemap.includes(`<loc>${url}</loc>`)) continue;
  sitemap = sitemap.replace("</urlset>", `  <url><loc>${url}</loc><lastmod>${escapeHtml(post.date || today)}</lastmod><changefreq>monthly</changefreq><priority>0.7</priority></url>\n</urlset>`);
}
await fs.writeFile(sitemapPath, sitemap, "utf8");
console.log(`Built site with ${posts.length} blog post(s).`);
