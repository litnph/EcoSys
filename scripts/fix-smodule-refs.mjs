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
  let s = fs.readFileSync(file, "utf8").replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  const before = s;

  // Syntax: empty first arg
  s = s.replace(/\(\s*,\s*/g, "(");
  s = s.replace(/,\s*,/g, ",");

  // missingModule patterns
  s = s.replace(/missingModule \? undefined : smoduleId(Raw)?/g, "");
  s = s.replace(/missingModule \? undefined : [^,\n]+/g, "");
  s = s.replace(/const missingModule = [^;]+;\n/g, "");
  s = s.replace(/const smoduleIdRaw = "";\s*/g, "");
  s = s.replace(/const smoduleId = "";\s*/g, "");
  s = s.replace(/const moduleIdRaw = [^;]+;\s*/g, "");
  s = s.replace(/enabled: !missingModule[^,\n]*,?\n/g, "");
  s = s.replace(/enabled: Boolean\(!missingModule[^)]*\),?\n/g, "");

  // Hook query keys
  s = s.replace(/queryKey: smoduleId\s*\?[^:]+: ([^,]+),/g, "queryKey: $1,");
  s = s.replace(/queryFn: \(\) => getBillingCycles\("",/g, "queryFn: () => getBillingCycles(");
  s = s.replace(/getBillingCycles\("",/g, "getBillingCycles(");

  // Remove smoduleId from stable keys
  s = s.replace(/\n\s*smoduleId,\n/g, "\n");
  s = s.replace(/stableInfiniteKey\(smoduleId,/g, "stableInfiniteKey(");
  s = s.replace(/transactionKeys\.list\(smoduleId,/g, "transactionKeys.list(");

  // Props - remove smoduleId lines
  s = s.replace(/^\s*smoduleId[?:].*$\n/gm, "");
  s = s.replace(/,\s*smoduleId\b/g, "");
  s = s.replace(/\{\s*smoduleId,\s*/g, "{ ");
  s = s.replace(/mapFormValuesToCreateBody\(smoduleId,/g, "mapFormValuesToCreateBody(");
  s = s.replace(/getInstallmentPlans\(smoduleId,/g, "getInstallmentPlans(");
  s = s.replace(/closeMonth\(smoduleId,/g, "closeMonth(");
  s = s.replace(/fetchReportPayload\(year, month, smoduleId\)/g, "fetchReportPayload(year, month)");
  s = s.replace(/fetchPeriodMeta\(year, month, smoduleId\)/g, "fetchPeriodMeta(year, month)");
  s = s.replace(/useDebtRecords\(smoduleId,/g, "useDebtRecords(");
  s = s.replace(/useCategories\(smoduleId,/g, "useCategories(");
  s = s.replace(/sourceKeys\.list\(variables\.smoduleId\)/g, "sourceKeys.list()");
  s = s.replace(/sourceKeys\.txCount\(variables\.smoduleId,/g, "sourceKeys.txCount(");
  s = s.replace(/mutateAsync\(\{ id: source\.id, smoduleId \}\)/g, "mutateAsync({ id: source.id })");
  s = s.replace(/!smoduleId \|\| smoduleId\.length === 0/g, "false");
  s = s.replace(/smoduleId \|\| undefined/g, "undefined");
  s = s.replace(/fetchEnabled \? smoduleId : undefined/g, "true");

  // buildQueryParams fix
  s = s.replace(
    /function buildQueryParams\(filters: TransactionFilters\): URLSearchParams \{\s*page:/,
    "function buildQueryParams(filters: TransactionFilters): URLSearchParams {\n  const qs = new URLSearchParams({\n    page:",
  );

  // reports navigate
  s = s.replace(
    /if \(!slice\.categoryId\) return;\s*categoryId: slice\.categoryId,\s*year: String\(slice\.year\),\s*month: String\(slice\.month\),\s*\}\);\s*router\.push\(`ROUTES\.dashboard\.transactions`\);/,
    `if (!slice.categoryId) return;
      const qs = new URLSearchParams({
        categoryId: slice.categoryId,
        year: String(slice.year),
        month: String(slice.month),
      });
      router.push(\`\${ROUTES.dashboard.transactions}?\${qs.toString()}\`);`,
  );

  if (s !== before) {
    fs.writeFileSync(file, s);
    console.log(path.relative(process.cwd(), file));
  }
}
