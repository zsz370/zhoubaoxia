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

interface SearchCommitItem {
  sha: string;
  commit?: {
    message?: string;
    committer?: { date?: string };
  };
  repository?: { full_name?: string };
}

const ENRICH_LIMIT = 25;
const ENRICH_CONCURRENCY = 5;
const MAX_DRAFTS = 60;

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

function firstLine(message: string, fallback: string): string {
  const line = message.split("\n")[0].trim().slice(0, 140);
  return line || fallback;
}

async function fetchDetailTitle(url: string): Promise<string | null> {
  try {
    const response = await fetch(url, {
      headers: githubHeaders(),
      cache: "no-store",
      signal: AbortSignal.timeout(8000),
    });
    if (!response.ok) return null;
    const data = (await response.json()) as { title?: string };
    return data.title ? data.title.trim().slice(0, 140) : null;
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
        const title = await fetchDetailTitle(item.url);
        if (title) item.draft.title = title;
      }),
    );
  }
}

/**
 * 提交搜索：事件流经常延迟或缺失推送，用搜索接口按作者 + 日期补齐提交。
 * 失败时静默返回空数组，不影响主流程。
 */
async function fetchSearchCommits(
  login: string,
  range?: { from: string; to: string },
): Promise<GithubEventDraft[]> {
  if (!range) return [];

  const dayFmt = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Shanghai",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const start = dayFmt.format(new Date(range.from));
  const end = dayFmt.format(new Date(range.to));
  const query = `author:${login} committer-date:${start}..${end}`;

  try {
    const response = await fetch(
      `https://api.github.com/search/commits?q=${encodeURIComponent(query)}&sort=committer-date&order=desc&per_page=50`,
      {
        headers: githubHeaders(),
        cache: "no-store",
        signal: AbortSignal.timeout(12_000),
      },
    );
    if (!response.ok) return [];

    const data = (await response.json()) as { items?: SearchCommitItem[] };
    return (data.items ?? []).flatMap((item) => {
      const repo = item.repository?.full_name ?? "";
      const message = item.commit?.message ?? "";
      const occurredAt = item.commit?.committer?.date;
      if (!repo || !occurredAt) return [];
      return [
        {
          type: "commit" as const,
          title: firstLine(message, "提交代码"),
          repo,
          ref: item.sha.slice(0, 7),
          occurredAt: new Date(occurredAt).toISOString(),
        },
      ];
    });
  } catch {
    return [];
  }
}

export interface GithubFetchResult {
  drafts: GithubEventDraft[];
  /** 接口返回的公开事件总数（近 90 天） */
  total: number;
  /** 最近一次公开活动时间 */
  latestAt: string | null;
}

/**
 * 拉取用户公开动态，映射为提交 / PR / Issue。
 * 事件流不返回提交消息与 PR 标题，需补全详情；推送事件延迟时用提交搜索补齐。
 */
export async function fetchGithubEvents(
  login: string,
  range?: { from: string; to: string },
): Promise<GithubFetchResult> {
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
  const events = Array.isArray(raw) ? raw : [];
  const latestFromEvents = events[0]?.created_at ?? null;

  const pending: { draft: GithubEventDraft; url: string | null }[] = [];

  for (const event of events) {
    if (range && (event.created_at < range.from || event.created_at > range.to)) {
      continue;
    }

    const repo = event.repo?.name ?? "";
    const payload = event.payload ?? {};

    if (event.type === "PushEvent") {
      const sha = String(payload.head ?? "").slice(0, 7);
      const branch = String(payload.ref ?? "").replace("refs/heads/", "");
      pending.push({
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
      pending.push({
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
      pending.push({
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

  const enrichTargets = pending
    .filter((item): item is { draft: GithubEventDraft; url: string } => Boolean(item.url))
    .slice(0, ENRICH_LIMIT);

  const searchCommits = await fetchSearchCommits(login, range);

  await enrichAll(enrichTargets);

  const merged = new Map<string, GithubEventDraft>();

  for (const item of pending) {
    merged.set(`${item.draft.type}|${item.draft.repo}|${item.draft.ref}`, item.draft);
  }

  // 搜索结果里的提交信息更准确，覆盖同一 sha 的「推送到分支」占位标题
  for (const commit of searchCommits) {
    merged.set(`${commit.type}|${commit.repo}|${commit.ref}`, commit);
  }

  const drafts = [...merged.values()]
    .sort((a, b) => b.occurredAt.localeCompare(a.occurredAt))
    .slice(0, MAX_DRAFTS);

  const latestAt =
    drafts[0]?.occurredAt && latestFromEvents
      ? drafts[0].occurredAt > latestFromEvents
        ? drafts[0].occurredAt
        : latestFromEvents
      : (drafts[0]?.occurredAt ?? latestFromEvents);

  return {
    drafts,
    total: Math.max(events.length, searchCommits.length),
    latestAt,
  };
}
