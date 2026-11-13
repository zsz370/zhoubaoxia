import { Client, TablesDB } from "node-appwrite";

const endpoint = process.env.APPWRITE_ENDPOINT;
const projectId = process.env.APPWRITE_PROJECT_ID;
const apiKey = process.env.APPWRITE_API_KEY;
const databaseId = process.env.APPWRITE_DATABASE_ID ?? "zhoubaoxia";

if (!endpoint || !projectId || !apiKey) {
  console.error(
    "缺少环境变量：APPWRITE_ENDPOINT / APPWRITE_PROJECT_ID / APPWRITE_API_KEY\n" +
      "请先在 .env.local 中填写，再运行 npm run setup:db",
  );
  process.exit(1);
}

const client = new Client()
  .setEndpoint(endpoint)
  .setProject(projectId)
  .setKey(apiKey);
const tables = new TablesDB(client);

const tablesSchema = [
  {
    id: "notes",
    name: "Notes",
    columns: [
      ["userId", 512],
      ["content", 2000],
      ["noteDate", 10],
      ["createdAt", 40],
    ],
    indexes: [{ key: "idx_notes_user_date", columns: ["userId", "noteDate"] }],
  },
  {
    id: "github_events",
    name: "GitHub Events",
    columns: [
      ["userId", 512],
      ["type", 16],
      ["title", 512],
      ["repo", 256],
      ["ref", 256],
      ["occurredAt", 40],
      ["createdAt", 40],
    ],
    indexes: [
      { key: "idx_events_user_occurred", columns: ["userId", "occurredAt"] },
    ],
  },
  {
    id: "reports",
    name: "Reports",
    columns: [
      ["userId", 512],
      ["perspective", 16],
      ["weekStart", 10],
      ["weekEnd", 10],
      ["contentMd", 100000],
      ["mode", 16],
      ["createdAt", 40],
      ["shareSlug", 64, false],
    ],
    indexes: [
      { key: "idx_reports_user_created", columns: ["userId", "createdAt"] },
    ],
  },
  {
    id: "shares",
    name: "Shares",
    columns: [
      ["userId", 512],
      ["reportId", 64],
      ["title", 512],
      ["contentMd", 100000],
      ["perspective", 16],
      ["weekLabel", 64],
      ["createdAt", 40],
    ],
    indexes: [{ key: "idx_shares_user", columns: ["userId"] }],
  },
];

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function ensureDatabase() {
  try {
    await tables.get(databaseId);
    console.log(`✓ 数据库已存在：${databaseId}`);
    return;
  } catch (error) {
    if (error?.code !== 404) throw error;
  }
  await tables.create(databaseId, "Zhoubaoxia");
  console.log(`✓ 已创建数据库：${databaseId}`);
}

async function ensureTable(table) {
  try {
    await tables.getTable(databaseId, table.id);
    console.log(`✓ 表已存在：${table.id}`);
  } catch (error) {
    if (error?.code !== 404) throw error;
    await tables.createTable(databaseId, table.id, table.name, [], true);
    console.log(`✓ 已创建表：${table.id}`);
  }
}

async function waitFor(check, label) {
  for (let attempt = 0; attempt < 60; attempt += 1) {
    const status = await check();
    if (status === "available") return;
    await sleep(1000);
  }
  throw new Error(`等待超时：${label}`);
}

async function main() {
  await ensureDatabase();

  for (const table of tablesSchema) {
    console.log(`→ 表 ${table.id}`);
    await ensureTable(table);

    for (const [key, size, required = true] of table.columns) {
      try {
        await tables.createStringColumn(
          databaseId,
          table.id,
          key,
          size,
          required,
        );
      } catch (error) {
        if (error?.code !== 409) throw error;
        const existing = await tables.getColumn(databaseId, table.id, key);
        if (existing.required !== required) {
          await tables.updateStringColumn(
            databaseId,
            table.id,
            key,
            required,
            null,
            size,
          );
          console.log(`  · 调整 ${table.id}.${key} required=${required}`);
        }
      }
    }

    for (const [key] of table.columns) {
      await waitFor(async () => {
        const column = await tables.getColumn(databaseId, table.id, key);
        return column.status;
      }, `${table.id}.${key}`);
    }

    for (const index of table.indexes) {
      try {
        await tables.createIndex(
          databaseId,
          table.id,
          index.key,
          "key",
          index.columns,
        );
      } catch (error) {
        if (error?.code !== 409) throw error;
      }
      await waitFor(async () => {
        const created = await tables.getIndex(
          databaseId,
          table.id,
          index.key,
        );
        return created.status;
      }, index.key);
    }
  }

  console.log("\n完成。接下来：");
  console.log("1. Appwrite 控制台 → Auth → Providers，启用 GitHub 并填入 OAuth App 凭据");
  console.log("2. Appwrite 控制台 → Connect → Apps，添加 Web 平台（Hostname: localhost）");
  console.log("3. 重启开发服务器后访问 /login 验证登录");
}

main().catch((error) => {
  console.error("初始化失败：", error?.message ?? error);
  process.exit(1);
});
