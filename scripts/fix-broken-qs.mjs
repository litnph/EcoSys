import fs from "node:fs";
import path from "node:path";

function walk(dir, files = []) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) walk(p, files);
    else if (/\.(ts|tsx)$/.test(ent.name)) files.push(p);
  }
  return files;
}

const root = path.join(process.cwd(), "src");
let n = 0;

for (const file of walk(root)) {
  let s = fs.readFileSync(file, "utf8");
  const before = s;

  s = s.replace(/const qs = new URLSearchParams\(\{\s*const /g, "const ");
  s = s.replace(/const qs = new URLSearchParams\(\{\s*if /g, "const qs = new URLSearchParams();\n  if ");
  s = s.replace(/const qs = new URLSearchParams\(\{\s*return /g, "return ");
  s = s.replace(/const qs = new URLSearchParams\(\{\s*\n\s*const \[/g, "const [");
  s = s.replace(/const qs = new URLSearchParams\(\{\s*\n/g, "");
  s = s.replace(/const qs = new URLSearchParams\(\{\s*\}\);/g, "");
  s = s.replace(/const qs = new URLSearchParams\(\);\s*\n\s*const qs/g, "const qs");

  // Drop empty qs query string
  s = s.replace(/\?\$\{qs\.toString\(\)\}/g, "${qs.toString() ? `?${qs.toString()}` : ''}");

  if (s !== before) {
    fs.writeFileSync(file, s);
    n++;
    console.log(path.relative(process.cwd(), file));
  }
}

console.log(`Patched ${n} files`);
