"use server";

import { revalidatePath } from "next/cache";
import { getSessionUser, updateUserPrefs } from "@/lib/auth";
import { fetchGithubEvents } from "@/lib/github";
import {
  createNote,
  createReport,
  createShare,
  deleteNote,
  listEvents,
  saveGithubEvents,
  updateReportContent,
} from "@/lib/store";
import {
  isPerspective,
  type GithubEvent,
  type Perspective,
} from "@/lib/types";
import { getWeekBoundsUTC, getWeekLabel, todayISO } from "@/lib/week";

type Result<T> = T | { error: string };

const GITHUB_LOGIN_PATTERN = /^[a-z\d](?:[a-z\d]|-(?=[a-z\d])){0,38}$/i;

export async function syncGithubAction(
  usernameInput: string,
): Promise<Result<{ imported: number; username: string; events: GithubEvent[] }>> {
  const user = await getSessionUser();
  if (!user) return { error: "请先登录" };

  const username = (usernameInput.trim().replace(/^@/, "") || user.githubUsername || "");
  if (!GITHUB_LOGIN_PATTERN.test(username)) {
    return { error: "GitHub 用户名格式不对，只填用户名，例如 torvalds" };
  }

  try {
    if (username !== user.githubUsername) {
      const savedPref = await updateUserPrefs({ githubUsername: username });
      if (!savedPref) return { error: "保存 GitHub 用户名失败，请重新登录后重试" };
    }

    const drafts = await fetchGithubEvents(username);
    const bounds = getWeekBoundsUTC();
    const weekly = drafts.filter(
      (draft) => draft.occurredAt >= bounds.from && draft.occurredAt <= bounds.to,
    );

    const imported = await saveGithubEvents(user.id, weekly);
    const events = await listEvents(user.id, bounds.from, bounds.to);

    revalidatePath("/dashboard");
    return { imported, username, events };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "同步失败，请稍后重试",
    };
  }
}

export async function addNoteAction(
  content: string,
): Promise<Result<{ id: string; date: string }>> {
  const user = await getSessionUser();
  if (!user) return { error: "请先登录" };

  const text = content.trim().slice(0, 200);
  if (!text) return { error: "记录不能为空" };

  try {
    const note = await createNote(user.id, text, todayISO());
    revalidatePath("/dashboard");
    return note;
  } catch {
    return { error: "保存失败，请稍后重试" };
  }
}

export async function deleteNoteAction(id: string): Promise<Result<{ ok: true }>> {
  const user = await getSessionUser();
  if (!user) return { error: "请先登录" };

  try {
    if (!(await deleteNote(user.id, id))) return { error: "记录不存在或已删除" };
    revalidatePath("/dashboard");
    return { ok: true };
  } catch {
    return { error: "删除失败，请稍后重试" };
  }
}

export async function saveReportAction(
  perspective: Perspective,
  markdown: string,
  mode: "llm" | "template",
): Promise<Result<{ id: string }>> {
  const user = await getSessionUser();
  if (!user) return { error: "请先登录" };
  if (!isPerspective(perspective) || !markdown.trim()) {
    return { error: "周报内容为空" };
  }

  try {
    const week = getWeekLabel();
    const id = await createReport(
      user.id,
      perspective,
      week.startISO,
      week.endISO,
      markdown,
      mode,
    );
    revalidatePath("/dashboard");
    return { id };
  } catch {
    return { error: "周报保存失败" };
  }
}

export async function saveReportEditAction(
  reportId: string,
  markdown: string,
): Promise<Result<{ ok: true }>> {
  const user = await getSessionUser();
  if (!user) return { error: "请先登录" };

  const content = markdown.trim();
  if (!content) return { error: "内容不能为空" };
  if (content.length > 20000) return { error: "内容过长，请精简后再保存" };

  try {
    const updated = await updateReportContent(user.id, reportId, content);
    if (!updated) return { error: "找不到这份周报" };
    revalidatePath("/dashboard");
    revalidatePath(`/reports/${reportId}`);
    return { ok: true };
  } catch {
    return { error: "保存失败，请稍后重试" };
  }
}

export async function createShareAction(
  reportId: string,
): Promise<Result<{ slug: string }>> {
  const user = await getSessionUser();
  if (!user) return { error: "请先登录" };

  try {
    const share = await createShare(user.id, reportId);
    if (!share) return { error: "找不到这份周报" };
    revalidatePath("/dashboard");
    return share;
  } catch {
    return { error: "分享链接创建失败" };
  }
}
