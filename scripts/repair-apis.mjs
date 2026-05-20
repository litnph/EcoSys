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

for (const file of walk(root)) {
  let s = fs.readFileSync(file, "utf8");
  const before = s;

  // Remove smodule lines
  s = s.replace(/^\s*smodule_id:.*\r?\n/gm, "");
  s = s.replace(/^\s*smoduleId:.*\r?\n/gm, "");

  // Remove orphaned closing }); after function open (leftover from URLSearchParams)
  s = s.replace(
    /(\): Promise<[^>]+> \{\r?\n)\s+(?:kind|source_id|page|page_size|status|direction)[^\n]*\r?\n(?:\s+[^\n]+\r?\n)*?\s+\}\);\r?\n/g,
    "$1",
  );

  // Fix dangling query suffix with undefined qs
  s = s.replace(
    /`\$\{([^`]+)\}\$\{qs\.toString\(\) \? `\?\$\{qs\.toString\(\)\}` : ''\}`/g,
    "`$1`",
  );
  s = s.replace(
    /apiClient\.(get|post|put|delete)\(`([^`]+)\$\{qs\.toString\(\) \? `\?\$\{qs\.toString\(\)\}` : ''\}`\)/g,
    'apiClient.$1("$2")',
  );

  // Remove smoduleId from interface fields (optional - keep in remote DTO is ok to remove mapping)
  s = s.replace(/^\s*smoduleId: string;\r?\n/gm, "");
  s = s.replace(/^\s*smoduleId: row\.smoduleId,\r?\n/gm, "");
  s = s.replace(/^\s*smoduleId: String\(row\.smoduleId\),\r?\n/gm, "");
  s = s.replace(/^\s*smoduleId: data\.smoduleId,\r?\n/gm, "");

  // CreateCategoryRequest - remove smoduleId field
  s = s.replace(/\s*smoduleId: string;\r?\n(\s*name: string;)/g, "\n$1");

  if (s !== before) {
    fs.writeFileSync(file, s);
    console.log(path.relative(process.cwd(), file));
  }
}
