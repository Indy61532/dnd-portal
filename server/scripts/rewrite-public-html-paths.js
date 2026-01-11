/* eslint-disable no-console */
/**
 * Rewrites relative href/src/action paths in HTML files under server/public/ to root-relative (/...),
 * resolving them against each file's directory so links remain correct after moving to Express static hosting.
 *
 * Skips:
 * - absolute URLs (http/https)
 * - protocol-relative URLs (//)
 * - anchors (#...)
 * - queries (?...)
 * - data/mailto/tel/javascript
 */

const fs = require("fs");
const path = require("path");

const PUBLIC_DIR = path.resolve(__dirname, "..", "public");

function walk(dir) {
  const out = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...walk(full));
    else out.push(full);
  }
  return out;
}

function isSkippableUrl(value) {
  if (!value) return true;
  const v = String(value).trim();
  if (!v) return true;
  if (v.startsWith("#")) return true;
  if (v.startsWith("?")) return true;
  if (v.startsWith("http://") || v.startsWith("https://")) return true;
  if (v.startsWith("//")) return true;
  if (v.startsWith("data:")) return true;
  if (v.startsWith("mailto:")) return true;
  if (v.startsWith("tel:")) return true;
  if (v.startsWith("javascript:")) return true;
  return false;
}

function toPosix(p) {
  return p.split(path.sep).join("/");
}

function resolveToRootRelative(fileAbs, value) {
  const v = String(value).trim();
  if (isSkippableUrl(v)) return v;
  if (v.startsWith("/")) return v; // already root-relative

  // file web path, like /pages/create.html
  const relFromPublic = path.relative(PUBLIC_DIR, fileAbs);
  const fileWebPath = "/" + toPosix(relFromPublic);
  const dirWebPath = path.posix.dirname(fileWebPath) + "/";

  // Resolve against directory and normalize.
  const resolved = path.posix.normalize(path.posix.join(dirWebPath, v));
  return resolved.startsWith("/") ? resolved : `/${resolved}`;
}

function rewriteHtmlFile(fileAbs) {
  const original = fs.readFileSync(fileAbs, "utf8");
  let changed = original;

  // Rewrite href/src/action attributes (single or double quotes).
  const attrRe = /\b(href|src|action)\s*=\s*("([^"]*)"|'([^']*)')/gi;
  changed = changed.replace(attrRe, (m, attr, quoted, dbl, sgl) => {
    const val = dbl != null ? dbl : sgl;
    const next = resolveToRootRelative(fileAbs, val);
    if (next === val) return m;
    const quote = quoted.startsWith("'") ? "'" : '"';
    return `${attr}=${quote}${next}${quote}`;
  });

  if (changed !== original) {
    fs.writeFileSync(fileAbs, changed, "utf8");
    return true;
  }
  return false;
}

function main() {
  if (!fs.existsSync(PUBLIC_DIR)) {
    console.error("Public dir not found:", PUBLIC_DIR);
    process.exit(1);
  }

  const htmlFiles = walk(PUBLIC_DIR).filter((f) => f.toLowerCase().endsWith(".html"));
  let touched = 0;
  for (const f of htmlFiles) {
    if (rewriteHtmlFile(f)) touched += 1;
  }
  console.log(`Rewrote paths in ${touched}/${htmlFiles.length} HTML files under ${PUBLIC_DIR}`);
}

main();


