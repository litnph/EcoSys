import fs from "node:fs";
import path from "node:path";

const files = [
  "src/app/[locale]/(dashboard)/automation/page.tsx",
  "src/app/[locale]/(dashboard)/billing/page.tsx",
  "src/app/[locale]/(dashboard)/categories/page.tsx",
  "src/app/[locale]/(dashboard)/debt/page.tsx",
  "src/app/[locale]/(dashboard)/installments/page.tsx",
  "src/app/[locale]/(dashboard)/investments/page.tsx",
  "src/app/[locale]/(dashboard)/reports/page.tsx",
  "src/app/[locale]/(dashboard)/savings/page.tsx",
  "src/app/[locale]/(dashboard)/sources/page.tsx",
  "src/app/[locale]/(dashboard)/tags/page.tsx",
  "src/app/[locale]/(dashboard)/transactions/page.tsx",
  "src/features/dashboard/components/DashboardOverview.tsx",
];

const root = process.cwd();

for (const rel of files) {
  const file = path.join(root, rel);
  if (!fs.existsSync(file)) continue;
  let s = fs.readFileSync(file, "utf8");
  s = s.replace(
    /^import \{ MissingFinanceModule \} from "@\/shared\/components\/finance\/MissingFinanceModule";\n/gm,
    "",
  );
  s = s.replace(
    /^import \{ useFinanceSmoduleId \} from "@\/shared\/hooks\/useFinanceSmoduleId";\n/gm,
    "",
  );
  s = s.replace(/^\s*const smoduleId = useFinanceSmoduleId\(\);\n/gm, "");
  s = s.replace(/^\s*const missingModule = smoduleId\.length === 0;\n/gm, "");
  s = s.replace(
    /\{missingModule \? \(\s*<MissingFinanceModule \/>\s*\) : /gs,
    "",
  );
  s = s.replace(/disabled=\{missingModule\}/g, "");
  s = s.replace(/useSources\(\s*\)/g, "useSources()");
  s = s.replace(/useSources\([^)]*\)/g, "useSources()");
  s = s.replace(/,\s*smoduleId/g, "");
  s = s.replace(/smoduleId=\{[^}]+\}/g, "");
  s = s.replace(/\?\s*""\s*:\s*undefined/g, "");
  fs.writeFileSync(file, s);
  console.log("fixed", rel);
}
