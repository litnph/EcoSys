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
  s = s.replace(/import \{ MissingFinanceModule \} from "@\/shared\/components\/finance\/MissingFinanceModule";\r?\n/g, "");
  s = s.replace(/import \{ useFinanceSmoduleId \} from "@\/shared\/hooks\/useFinanceSmoduleId";\r?\n/g, "");
  s = s.replace(/import \{ useSmoduleId \} from "@\/shared\/hooks\/useSmoduleId";\r?\n/g, "");
  s = s.replace(/\s*const smoduleId = "";\r?\n/g, "");
  s = s.replace(/\s*const smoduleId = useFinanceSmoduleId\(\);\r?\n/g, "");
  s = s.replace(/\s*const missing(Module)? = !?smoduleId[^;]*;\r?\n/g, "");
  s = s.replace(/\s*const missingModule = smoduleId\.length === 0;\r?\n/g, "");
  s = s.replace(/\{missing(Module)? \? \(\s*<MissingFinanceModule \/>\s*\) : /gs, "");
  s = s.replace(/disabled=\{missing(Module)?\}/g, "");
  s = s.replace(/useTags\(smoduleId \|\| undefined\)/g, "useTags()");
  s = s.replace(/useTags\([^)]*\)/g, "useTags()");
  s = s.replace(/useSources\([^)]*\)/g, "useSources()");
  s = s.replace(/<MissingFinanceModule \/>/g, "");
  if (s !== before) {
    fs.writeFileSync(file, s);
    n++;
    console.log(path.relative(process.cwd(), file));
  }
}
console.log(`Updated ${n} files`);
