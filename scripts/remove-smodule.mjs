import fs from "node:fs";
import path from "node:path";

const srcRoot = path.join(process.cwd(), "src");

function walk(dir, files = []) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) {
      if (["organizations", "spaces", "workspace"].includes(ent.name)) continue;
      walk(p, files);
    } else if (/\.(ts|tsx)$/.test(ent.name)) {
      files.push(p);
    }
  }
  return files;
}

function transform(content) {
  let s = content;

  // Remove imports
  s = s.replace(
    /^import \{ MissingFinanceModule \} from "@\/shared\/components\/finance\/MissingFinanceModule";\n/gm,
    "",
  );
  s = s.replace(
    /^import \{ useFinanceSmoduleId \} from "@\/shared\/hooks\/useFinanceSmoduleId";\n/gm,
    "",
  );
  s = s.replace(
    /^import \{ useSmoduleId \} from "@\/shared\/hooks\/useSmoduleId";\n/gm,
    "",
  );

  // Remove smoduleId lines in objects/types
  s = s.replace(/^\s*smoduleId: string;\n/gm, "");
  s = s.replace(/^\s*smoduleId\?: string;\n/gm, "");
  s = s.replace(/^\s*smoduleId: row\.smoduleId,\n/gm, "");
  s = s.replace(/^\s*smoduleId: data\.smoduleId,\n/gm, "");
  s = s.replace(/^\s*smoduleId,\n/gm, "");

  // Query params
  s = s.replace(/\s*smodule_id:\s*[^,\n]+,?\n/g, "");
  s = s.replace(
    /const qs = new URLSearchParams\(\{\s*\}\);\s*\n\s*apiClient\.get\(`([^`]+)\?\$\{qs\.toString\(\)\}`\)/g,
    "apiClient.get(`$1`)",
  );
  s = s.replace(
    /const qs = new URLSearchParams\(\{\s*\}\);\s*\n\s*apiClient\.get\(`([^`]+)\?\$\{qs\.toString\(\)\}`/g,
    "apiClient.get(`$1`",
  );
  s = s.replace(/\?`\$\{qs\.toString\(\)\}`/g, "");
  s = s.replace(/new URLSearchParams\(\{\s*\}\)/g, "");

  // Function params
  s = s.replace(/\(smoduleId: string\)/g, "()");
  s = s.replace(/\(smoduleId: string \| undefined\)/g, "()");
  s = s.replace(/, smoduleId: string/g, "");
  s = s.replace(/smoduleId: string \| undefined,\s*/g, "");
  s = s.replace(/smoduleId: string,\s*/g, "");

  // Hook calls
  s = s.replace(/useFinanceSmoduleId\(\)/g, '""');
  s = s.replace(/const smoduleId = "";\n/g, "");
  s = s.replace(/const missingModule = smoduleId\.length === 0;\n/g, "");
  s = s.replace(/missingModule \? \([\s\S]*?\) : /g, "");
  s = s.replace(/disabled=\{missingModule\}/g, "");
  s = s.replace(/smoduleId\.length \? smoduleId : undefined/g, "");
  s = s.replace(/smoduleId\.length \? smoduleId : ""/g, '""');
  s = s.replace(/smoduleId=\{[^}]+\}/g, "");
  s = s.replace(/smoduleId\?\?/g, "");
  s = s.replace(/enabled: Boolean\(smoduleId[^)]*\)/g, "enabled: true");
  s = s.replace(/enabled: Boolean\([^)]*smoduleId[^)]*\)/g, "enabled: true");
  s = s.replace(/smoduleId \?\? ""/g, '""');
  s = s.replace(/smoduleId \|\| ""/g, '""');

  // Query keys
  s = s.replace(/list: \(smoduleId: string\) =>/g, "list: () =>");
  s = s.replace(/summary: \(smoduleId: string\) =>/g, "summary: () =>");
  s = s.replace(/\(smoduleId\)/g, "()");
  s = s.replace(/\["[^"]+", smoduleId\]/g, (m) => m.replace(/, smoduleId/, ""));

  return s;
}

const files = walk(srcRoot);
let changed = 0;
for (const file of files) {
  const before = fs.readFileSync(file, "utf8");
  const after = transform(before);
  if (after !== before) {
    fs.writeFileSync(file, after);
    changed++;
  }
}

console.log(`Updated ${changed} files`);
