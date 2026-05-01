import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL(".", import.meta.url));
const sourceDir = join(root, "public");
const distDir = join(root, "public-dist");
const version = "secure-4";

function compactLines(source) {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .join(" ");
}

function minifyCss(source) {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/\s+/g, " ")
    .replace(/\s*([{}:;,>])\s*/g, "$1")
    .replace(/;}/g, "}")
    .trim();
}

function minifyHtml(source) {
  return source
    .replace(/<link rel="preconnect"[^>]+>\s*/g, "")
    .replace(/<link href="https:\/\/fonts\.googleapis\.com[^>]+>\s*/g, "")
    .replace(/\/favicon\.svg\?v=[^"]+/g, `/favicon.svg?v=${version}`)
    .replace(/\/styles\.css\?v=[^"]+/g, `/styles.min.css?v=${version}`)
    .replace(/\/app\.js\?v=[^"]+/g, `/app.min.js?v=${version}`)
    .replace(/>\s+</g, "><")
    .trim();
}

await rm(distDir, { recursive: true, force: true });
await mkdir(distDir, { recursive: true });

const [html, js, css, favicon] = await Promise.all([
  readFile(join(sourceDir, "index.html"), "utf8"),
  readFile(join(sourceDir, "app.js"), "utf8"),
  readFile(join(sourceDir, "styles.css"), "utf8"),
  readFile(join(sourceDir, "favicon.svg"), "utf8")
]);

await Promise.all([
  writeFile(join(distDir, "index.html"), minifyHtml(html)),
  writeFile(join(distDir, "app.min.js"), compactLines(js)),
  writeFile(join(distDir, "styles.min.css"), minifyCss(css)),
  writeFile(join(distDir, "favicon.svg"), favicon)
]);

console.log("Built minified public-dist assets.");
