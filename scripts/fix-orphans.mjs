import fs from "node:fs";

const fixes = [
  {
    file: "src/features/categories/api/categoriesApi.ts",
    replacements: [
      [
        /export async function getCategories\(\s*kind: CategoryKind,\s*\): Promise<FinCategory\[\]> \{[^]*?return envelope\.roots\.map\(mapTreeNode\);/,
        `export async function getCategories(
  kind: CategoryKind,
): Promise<FinCategory[]> {
  const qs = new URLSearchParams({ kind });
  const envelope = await unwrap<GetCategoriesEnvelope>(
    apiClient.get(\`/finance/categories?\${qs.toString()}\`),
  );
  return envelope.roots.map(mapTreeNode);`,
      ],
      [
        /export async function getFlatCategories\(\s*kind: CategoryKind,\s*\): Promise<FinCategoryFlat\[\]> \{[^]*?return envelope\.items\.map\(mapFlatRow\);/,
        `export async function getFlatCategories(
  kind: CategoryKind,
): Promise<FinCategoryFlat[]> {
  const qs = new URLSearchParams({ kind });
  const envelope = await unwrap<GetFlatCategoriesEnvelope>(
    apiClient.get(\`/finance/categories/flat?\${qs.toString()}\`),
  );
  return envelope.items.map(mapFlatRow);`,
      ],
    ],
  },
  {
    file: "src/features/sources/api/sourcesApi.ts",
    replacements: [
      [
        /export async function getSourceTransactionCount\(\s*sourceId: string,\s*\): Promise<number> \{[^]*?return envelope\.totalCount;/,
        `export async function getSourceTransactionCount(
  sourceId: string,
): Promise<number> {
  const qs = new URLSearchParams({
    source_id: sourceId,
    page: "1",
    page_size: "1",
  });
  const envelope = await unwrap<TransactionsPageEnvelope>(
    apiClient.get(\`/finance/transactions?\${qs.toString()}\`),
  );
  return envelope.totalCount;`,
      ],
    ],
  },
  {
    file: "src/features/dashboard/api/dashboardApi.ts",
    replacements: [
      [
        /export async function getRecentTransactions\(\s*limit = 5,\s*\): Promise<Transaction\[\]> \{[^]*?return mapTransactions\(data\.items\);/,
        `export async function getRecentTransactions(
  limit = 5,
): Promise<Transaction[]> {
  const qs = new URLSearchParams({
    page: "1",
    page_size: String(limit),
  });
  const data = await unwrap<TransactionsEnvelope>(
    apiClient.get(\`/finance/transactions?\${qs.toString()}\`),
  );
  return mapTransactions(data.items);`,
      ],
    ],
  },
  {
    file: "src/features/automation/api/automationApi.ts",
    replacements: [
      [
        /apiClient\.get\(`\/automation\/rules\$\{qs\.toString\(\)[^`]*`\)/,
        'apiClient.get("/automation/rules")',
      ],
      [
        /apiClient\.get\("\/automation\/rules"\)/,
        'apiClient.get("/automation/rules")',
      ],
    ],
  },
];

for (const { file, replacements } of fixes) {
  let s = fs.readFileSync(file, "utf8").replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  for (const [re, rep] of replacements) {
    s = s.replace(re, rep);
  }
  fs.writeFileSync(file, s);
  console.log("fixed", file);
}
