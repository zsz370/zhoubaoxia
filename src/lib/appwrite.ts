import { Account, Client, TablesDB } from "node-appwrite";

export const APPWRITE_DATABASE_ID =
  process.env.APPWRITE_DATABASE_ID ?? "zhoubaoxia";

export const TABLES = {
  notes: "notes",
  events: "github_events",
  reports: "reports",
  shares: "shares",
} as const;

export function isAppwriteConfigured(): boolean {
  return Boolean(
    process.env.APPWRITE_ENDPOINT &&
      process.env.APPWRITE_PROJECT_ID &&
      process.env.APPWRITE_API_KEY,
  );
}

export function sessionCookieName(): string {
  return `a_session_${process.env.APPWRITE_PROJECT_ID ?? "zhoubaoxia"}`;
}

function baseClient(): Client {
  return new Client()
    .setEndpoint(process.env.APPWRITE_ENDPOINT!)
    .setProject(process.env.APPWRITE_PROJECT_ID!);
}

/** 带 API Key 的服务端客户端，绕过行权限，调用方需自行校验归属 */
export function adminClient(): Client {
  return baseClient().setKey(process.env.APPWRITE_API_KEY!);
}

export function adminTables(): TablesDB {
  return new TablesDB(adminClient());
}

/** 以用户会话身份调用，用于获取当前登录用户 */
export function sessionAccount(sessionSecret: string): Account {
  return new Account(baseClient().setSession(sessionSecret));
}

/** 不含 API Key 的客户端，用于创建 OAuth 跳转 */
export function publicAccount(): Account {
  return new Account(baseClient());
}

/**
 * 带 API Key 的 Account：Appwrite 只在带 API Key 的请求里返回 session.secret，
 * 服务端写 Cookie 必须用它来换会话密钥。
 */
export function keyedAccount(): Account {
  return new Account(adminClient());
}
