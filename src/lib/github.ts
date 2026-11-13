import { createHash } from "node:crypto";

export type GithubEventType = "commit" | "pr" | "issue";

export interface GithubEventDraft {
  type: GithubEventType;
  title: string;
  repo: string;
  ref: string;
  occurredAt: string;
}

interface RawCommit {
  sha?: string;
  message?: string;
}

interface RawEvent {
  id: string;
  type: string;
  created_at: string;
  repo?: { name?: string };
  payload?: {
    commits?: RawCommit[];
    pull_request?: { number?: number; title?: string };
    issue?: { number?: number; title?: string };
  };
}

export function eventRowId(draft: GithubEventDraft): string {
  return createHash("sha256")
    .update(`${draft.type}|${draft.repo}|${draft.ref}|${draft.title}`)
    .digest("hex")
    .slice(0, 32);
}

/** 拉取用户公开动态，映射为提交 / PR / Issue 三类事件 */
export async function fetchGithubEvents(
  login: string,
): Promise<GithubEventDraft[]> {
  const token = process.env.GITHUB_TOKEN;

  const response = await fetch(
    `https://api.github.com/users/${encodeURIComponent(login)}/events/public?per_page=100`,
    {
      headers: {
        Accept: "application/vnd.github+json",
        "User-Agent": "zhoubaoxia",
        "X-GitHub-Api-Version": "2022-11-28",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      cache: "no-store",
    },
  );

  if (response.status === 404) throw new Error("找不到这个 GitHub 用户");
  if (response.status === 403 || response.status === 429) {
    throw new Error("GitHub 接口限流，请过几分钟再试");
  }
  if (!response.ok) throw new Error("GitHub 同步失败，请稍后重试");

  const raw = (await response.json()) as RawEvent[];
  if (!Array.isArray(raw)) return [];

  const drafts: GithubEventDraft[] = [];

  for (const event of raw) {
    const repo = event.repo?.name ?? "";
    const payload = event.payload ?? {};

    if (event.type === "PushEvent") {
      for (const commit of payload.commits ?? []) {
        const message = String(commit.message ?? "").split("\n")[0].trim();
        if (!message) continue;
        drafts.push({
          type: "commit",
          title: message.slice(0, 140),
          repo,
          ref: String(commit.sha ?? "").slice(0, 7),
          occurredAt: event.created_at,
        });
      }
      continue;
    }

    if (event.type === "PullRequestEvent" && payload.pull_request?.title) {
      drafts.push({
        type: "pr",
        title: payload.pull_request.title.slice(0, 140),
        repo,
        ref: `#${payload.pull_request.number ?? ""}`,
        occurredAt: event.created_at,
      });
      continue;
    }

    if (event.type === "IssuesEvent" && payload.issue?.title) {
      drafts.push({
        type: "issue",
        title: payload.issue.title.slice(0, 140),
        repo,
        ref: `#${payload.issue.number ?? ""}`,
        occurredAt: event.created_at,
      });
    }
  }

  return drafts;
}
