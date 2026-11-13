import { createHash } from "node:crypto";

export type GithubEventType = "commit" | "pr" | "issue";

export interface GithubEventDraft {
  type: GithubEventType;
  title: string;
  repo: string;
  ref: string;
  occurredAt: string;
}

interface RawEvent {
  id: string;
  type: string;
  created_at: string;
  repo?: { name?: string };
  payload?: {
    ref?: string;
    head?: string;
    number?: number;
    pull_request?: { number?: number; title?: string; url?: string };
    issue?: { number?: number; title?: string; url?: string };
  };
}

const ENRICH_LIMIT = 25;
const ENRICH_CONCURRENCY = 5;

export function eventRowId(draft: GithubEventDraft): string {
  return createHash("sha256")
    .update(`${draft.type}|${draft.repo}|${draft.ref}|${draft.title}`)
    .digest("hex")
    .slice(0, 32);
}

function githubHeaders(): Record<string, string> {
  const token = process.env.GITHUB_TOKEN;
  return {
    Accept: "application/vnd.github+json",
    "User-Agent": "zhoubaoxia",
    "X-GitHub-Api-Version": "2022-11-28",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function fetchAppTitle(url: string): Promise<string | null> {
  try {
    const response = await fetch(url, {
      headers: githubHeaders(),
      cache: "no-store",
      signal: AbortSignal.timeout(8000),
    });
    if (!response.ok) return null;
    const data = (await response.json()) as {
      title?: string;
      commit?: { message?: string };
    };
    const title = data.title ?? data.commit?.message;
    if (!title) return null;
    return String(title).split("\n")[0].trim().slice(0, 140) || null;
  } catch {
    return null;
  }
}

async function enrichAll(
  items: { draft: GithubEventDraft; url: string }[],
): Promise<void> {
  for (let index = 0; index < items.length; index += ENRICH_CONCURRENCY) {
    const batch = items.slice(index, index + ENRICH_CONCURRENCY);
    await Promise.all(
      batch.map(async (item) => {
        const title = await fetchAppTitle(item.url);
        if (title) item.draft.title = title;
      }),
    );
  }
}

/**
 * 拉取用户公开动态，映射为提交 / PR / Issue。
 * 当前 GitHub 事件接口不再返回提交消息与 PR 标题，需要按需补全详情。
 */
export async function fetchGithubEvents(
  login: string,
  range?: { from: string; to: string },
): Promise<GithubEventDraft[]> {
  const response = await fetch(
    `https://api.github.com/users/${encodeURIComponent(login)}/events/public?per_page=100`,
    {
      headers: githubHeaders(),
      cache: "no-store",
      signal: AbortSignal.timeout(15_000),
    },
  );

  if (response.status === 404) throw new Error("找不到这个 GitHub 用户");
  if (response.status === 403 || response.status === 429) {
    throw new Error("GitHub 接口限流，请过几分钟再试");
  }
  if (!response.ok) throw new Error("GitHub 同步失败，请稍后重试");

  const raw = (await response.json()) as RawEvent[];
  if (!Array.isArray(raw)) return [];

  const drafts: { draft: GithubEventDraft; url: string | null }[] = [];

  for (const event of raw) {
    if (range && (event.created_at < range.from || event.created_at > range.to)) {
      continue;
    }

    const repo = event.repo?.name ?? "";
    const payload = event.payload ?? {};

    if (event.type === "PushEvent") {
      const sha = String(payload.head ?? "").slice(0, 7);
      const branch = String(payload.ref ?? "").replace("refs/heads/", "");
      drafts.push({
        draft: {
          type: "commit",
          title: branch ? `推送到 ${branch}` : "代码推送",
          repo,
          ref: sha || "push",
          occurredAt: event.created_at,
        },
        url:
          repo && payload.head
            ? `https://api.github.com/repos/${repo}/commits/${payload.head}`
            : null,
      });
      continue;
    }

    if (event.type === "PullRequestEvent" && payload.pull_request?.number) {
      drafts.push({
        draft: {
          type: "pr",
          title: `PR #${payload.pull_request.number}`,
          repo,
          ref: `#${payload.pull_request.number}`,
          occurredAt: event.created_at,
        },
        url: payload.pull_request.url ?? null,
      });
      continue;
    }

    if (event.type === "IssuesEvent" && payload.issue?.number) {
      drafts.push({
        draft: {
          type: "issue",
          title: `Issue #${payload.issue.number}`,
          repo,
          ref: `#${payload.issue.number}`,
          occurredAt: event.created_at,
        },
        url: payload.issue.url ?? null,
      });
    }
  }

  const enrichTargets = drafts
    .filter((item): item is { draft: GithubEventDraft; url: string } => Boolean(item.url))
    .slice(0, ENRICH_LIMIT);

  await enrichAll(enrichTargets);

  return drafts.map((item) => item.draft);
}
