"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import {
  Check,
  CircleDot,
  Copy,
  GitBranch,
  GitPullRequest,
  Link2,
  Loader2,
  Pencil,
  Plus,
  RefreshCw,
  Share2,
  ShieldCheck,
  Sparkles,
  Trash2,
} from "lucide-react";
import { MarkdownView } from "@/components/markdown-view";
import { PERSPECTIVES } from "@/lib/perspectives";
import { todayMMDD } from "@/lib/week";
import type {
  GenerateResponse,
  GithubEvent,
  NoteItem,
  Perspective,
} from "@/lib/types";
import { addNoteAction, createShareAction, deleteNoteAction, saveReportAction, saveReportEditAction, syncGithubAction } from "./actions";

function EventIcon({ type }: { type: GithubEvent["type"] }) {
  if (type === "commit") return <GitBranch className="size-3.5" />;
  if (type === "pr") return <GitPullRequest className="size-3.5" />;
  return <CircleDot className="size-3.5" />;
}

export function Workbench({
  demoMode,
  weekRange,
  initialNotes,
  events: initialEvents,
  githubUsername,
}: {
  demoMode: boolean;
  weekRange: string;
  initialNotes: NoteItem[];
  events: GithubEvent[];
  githubUsername: string | null;
}) {
  const [notes, setNotes] = useState<NoteItem[]>(initialNotes);
  const [events, setEvents] = useState<GithubEvent[]>(initialEvents);
  const [username, setUsername] = useState(githubUsername ?? "");
  const [syncing, setSyncing] = useState(false);
  const [syncNote, setSyncNote] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [savingNote, setSavingNote] = useState(false);
  const [perspective, setPerspective] = useState<Perspective>("up");
  const [markdown, setMarkdown] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [editDraft, setEditDraft] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);
  const [editedSaved, setEditedSaved] = useState(false);
  const [mode, setMode] = useState<"llm" | "template" | null>(null);
  const [reportId, setReportId] = useState<string | null>(null);
  const [shareSlug, setShareSlug] = useState<string | null>(null);
  const [sharing, setSharing] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const activeMeta =
    PERSPECTIVES.find((item) => item.id === perspective) ?? PERSPECTIVES[0];
  const traceCount = notes.length + events.length;

  async function addNote(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const content = draft.trim();
    if (!content || savingNote) return;

    setError(null);

    if (demoMode) {
      setNotes((prev) => [
        { id: crypto.randomUUID(), content: content.slice(0, 200), date: todayMMDD() },
        ...prev,
      ]);
      setDraft("");
      return;
    }

    setSavingNote(true);
    const result = await addNoteAction(content);
    setSavingNote(false);

    if ("error" in result) {
      setError(result.error);
      return;
    }

    setNotes((prev) => [{ id: result.id, content, date: result.date }, ...prev]);
    setDraft("");
  }

  async function removeNote(id: string) {
    if (demoMode) {
      setNotes((prev) => prev.filter((note) => note.id !== id));
      return;
    }

    const result = await deleteNoteAction(id);
    if ("error" in result) {
      setError(result.error);
      return;
    }
    setNotes((prev) => prev.filter((note) => note.id !== id));
  }

  async function syncGithub() {
    if (syncing) return;
    setSyncing(true);
    setSyncNote(null);
    setError(null);

    const result = await syncGithubAction(username);
    setSyncing(false);

    if ("error" in result) {
      setError(result.error);
      return;
    }

    setUsername(result.username);
    setEvents(result.events);
    setSyncNote(
      result.imported > 0
        ? `已同步 ${result.imported} 条新动态`
        : "本周暂无新的公开动态",
    );
  }

  async function generate() {
    setLoading(true);
    setError(null);
    setShareSlug(null);
    setEditing(false);
    setEditedSaved(false);

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ perspective, notes, events }),
      });

      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as {
          error?: string;
        } | null;
        throw new Error(data?.error ?? "生成失败，请稍后重试");
      }

      const data = (await response.json()) as GenerateResponse;
      setMarkdown(data.markdown);
      setMode(data.mode);
      setReportId(null);

      if (!demoMode) {
        const saved = await saveReportAction(perspective, data.markdown, data.mode);
        if ("error" in saved) {
          setError(`周报已生成，但保存失败：${saved.error}`);
        } else {
          setReportId(saved.id);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "生成失败，请稍后重试");
    } finally {
      setLoading(false);
    }
  }

  async function copy() {
    if (!markdown) return;
    await navigator.clipboard.writeText(markdown);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }

  function startEdit() {
    if (!markdown) return;
    setEditDraft(markdown);
    setEditedSaved(false);
    setEditing(true);
  }

  async function finishEdit() {
    if (savingEdit) return;

    const content = editDraft.trim();
    if (!content) {
      setError("内容不能为空");
      return;
    }

    if (!reportId) {
      setMarkdown(content);
      setEditing(false);
      return;
    }

    setSavingEdit(true);
    const result = await saveReportEditAction(reportId, content);
    setSavingEdit(false);

    if ("error" in result) {
      setError(result.error);
      return;
    }

    setMarkdown(content);
    setEditing(false);
    setEditedSaved(true);
  }

  async function share() {
    if (!reportId || sharing) return;

    setSharing(true);
    setError(null);
    const result = await createShareAction(reportId);
    setSharing(false);

    if ("error" in result) {
      setError(result.error);
      return;
    }
    setShareSlug(result.slug);
    window.open(`/r/${result.slug}`, "_blank", "noopener,noreferrer");
  }

  async function copyShareLink() {
    if (!shareSlug) return;
    await navigator.clipboard.writeText(`${window.location.origin}/r/${shareSlug}`);
    setCopiedLink(true);
    window.setTimeout(() => setCopiedLink(false), 1600);
  }

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-5 py-8">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-[22px] font-semibold tracking-tight">工作台</h1>
          <p className="mt-1 text-[12.5px] text-muted">
            本周 {weekRange} · 先留痕，再成稿
          </p>
        </div>
        {demoMode ? (
          <span className="rounded-full bg-brand-soft px-3 py-1 text-[11px] text-brand-deep">
            演示模式 · 数据仅保存在当前页面
          </span>
        ) : null}
      </div>

      <div className="grid items-start gap-5 lg:grid-cols-[0.95fr_1.05fr]">
        {/* 左：本周痕迹 */}
        <section className="rounded-2xl border border-line bg-card p-5 sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-[15px] font-semibold">本周痕迹</h2>
              <p className="mt-0.5 text-[11.5px] text-muted">
                提交与记录，是周报的原料
              </p>
            </div>
            <span className="rounded-full bg-paper px-2.5 py-1 text-[11px] text-muted">
              {traceCount} 条
            </span>
          </div>

          <div className="mt-5 rounded-xl border border-dashed border-line bg-paper/40 p-3">
            <div className="flex items-center justify-between px-1">
              <span className="inline-flex items-center gap-1.5 text-[12px] font-medium text-ink-soft">
                <GitBranch className="size-3.5" />
                GitHub 动态
                {!demoMode && username ? (
                  <span className="font-mono text-[10.5px] text-muted">
                    @{username}
                  </span>
                ) : null}
              </span>
              {demoMode ? (
                <span className="text-[10.5px] text-muted">示例数据</span>
              ) : (
                <button
                  type="button"
                  onClick={syncGithub}
                  disabled={syncing || !username.trim()}
                  className="inline-flex items-center gap-1 rounded-full border border-line bg-card px-2.5 py-1 text-[10.5px] text-muted transition-colors hover:text-ink disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {syncing ? (
                    <Loader2 className="size-3 animate-spin" />
                  ) : (
                    <RefreshCw className="size-3" />
                  )}
                  同步
                </button>
              )}
            </div>

            {!demoMode && !githubUsername ? (
              <div className="mt-2 px-1">
                <input
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                  placeholder="填 GitHub 用户名，如 torvalds"
                  className="h-9 w-full rounded-lg border border-line bg-card px-2.5 text-[12px] outline-none transition-colors placeholder:text-muted/70 focus:border-brand"
                />
                <p className="mt-1.5 text-[10.5px] leading-5 text-muted">
                  同步会读取你公开的提交、PR 与 Issue，不涉及私有仓库。
                </p>
              </div>
            ) : null}

            {syncNote ? (
              <p className="mt-2 px-1 text-[10.5px] text-brand-deep">{syncNote}</p>
            ) : null}
            {events.length > 0 ? (
              <ul className="mt-2 space-y-0.5">
                {events.map((item) => (
                  <li
                    key={item.id}
                    className="flex items-start gap-2.5 rounded-lg px-2 py-2 transition-colors hover:bg-card"
                  >
                    <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-md bg-card text-muted">
                      <EventIcon type={item.type} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[12.5px] text-ink-soft">
                        {item.title}
                      </p>
                      <p className="mt-0.5 truncate font-mono text-[10.5px] text-muted">
                        {item.repo} · {item.ref} · {item.date}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="px-2 py-6 text-center text-[11.5px] text-muted">
                还没有同步到 GitHub 动态，先用手动记录也能生成周报。
              </p>
            )}
          </div>

          <form onSubmit={addNote} className="mt-4 flex gap-2">
            <input
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              maxLength={200}
              placeholder="记一句：今天做了什么、卡在哪…"
              className="h-10 min-w-0 flex-1 rounded-xl border border-line bg-paper/60 px-3 text-[13px] outline-none transition-colors placeholder:text-muted/70 focus:border-brand focus:bg-card"
            />
            <button
              type="submit"
              disabled={savingNote}
              className="inline-flex h-10 shrink-0 items-center gap-1 rounded-xl bg-ink px-3.5 text-[12.5px] font-medium text-white transition-colors hover:bg-ink/85 disabled:opacity-60"
            >
              {savingNote ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <Plus className="size-3.5" />
              )}
              记一笔
            </button>
          </form>

          <ul className="mt-3 space-y-2">
            {notes.length === 0 ? (
              <li className="rounded-xl border border-dashed border-line bg-paper/40 px-4 py-8 text-center text-xs text-muted">
                还没有记录。先写下今天做的一件事。
              </li>
            ) : (
              notes.map((note) => (
                <li
                  key={note.id}
                  className="group flex items-start gap-2.5 rounded-xl bg-paper/50 px-3 py-2.5"
                >
                  <span className="mt-0.5 shrink-0 rounded-md bg-card px-1.5 py-0.5 font-mono text-[10px] text-muted">
                    {note.date}
                  </span>
                  <p className="min-w-0 flex-1 text-[12.5px] leading-6 text-ink-soft">
                    {note.content}
                  </p>
                  <button
                    type="button"
                    onClick={() => removeNote(note.id)}
                    aria-label="删除这条记录"
                    className="mt-0.5 text-muted/50 opacity-0 transition-opacity hover:text-red-500 group-hover:opacity-100"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </li>
              ))
            )}
          </ul>

          <p className="mt-4 border-t border-line pt-3 text-[11px] leading-5 text-muted/80">
            {demoMode
              ? "当前用示例数据演示完整流程，登录后可同步你自己的 GitHub 动态。"
              : "只同步公开动态；私有仓库里的工作请用上面的手动记录补充。"}
          </p>
        </section>

        {/* 右：生成周报 */}
        <section className="rounded-2xl border border-line bg-card p-5 sm:p-6">
          <div className="flex items-center gap-2">
            <span className="flex size-8 items-center justify-center rounded-lg bg-brand-soft text-brand-deep">
              <Sparkles className="size-4" />
            </span>
            <div>
              <h2 className="text-[15px] font-semibold">生成周报</h2>
              <p className="text-[11.5px] text-muted">同一份事实，换三种说法</p>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-3 gap-2">
            {PERSPECTIVES.map((item) => {
              const active = item.id === perspective;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setPerspective(item.id)}
                  className={
                    active
                      ? "rounded-xl border border-brand bg-brand-soft px-2 py-2.5 text-brand-deep"
                      : "rounded-xl border border-line bg-paper/40 px-2 py-2.5 text-muted transition-colors hover:border-ink/20"
                  }
                >
                  <span className="block text-[12.5px] font-medium">
                    {item.label}
                  </span>
                  <span className="mt-0.5 block text-[10px] opacity-80">
                    {item.audience}
                  </span>
                </button>
              );
            })}
          </div>

          <p className="mt-3 text-[11.5px] leading-5 text-muted">
            {activeMeta.hint}
            <span className="ml-1 font-mono text-[10.5px] text-muted/70">
              {activeMeta.sections}
            </span>
          </p>

          <button
            type="button"
            onClick={generate}
            disabled={loading || traceCount === 0}
            className="mt-4 inline-flex h-11 w-full items-center justify-center gap-2 rounded-full bg-brand text-sm font-medium text-white transition-colors hover:bg-brand-deep disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                正在整理证据…
              </>
            ) : (
              <>
                <Sparkles className="size-4" />
                生成周报
              </>
            )}
          </button>

          {error ? (
            <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-[12px] text-red-600">
              {error}
            </p>
          ) : null}

          {markdown ? (
            <div className="mt-4 rounded-2xl border border-line bg-paper/50 p-4 sm:p-5">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                <span className="inline-flex items-center gap-1.5 text-[11px] text-muted">
                  <ShieldCheck className="size-3.5 text-brand" />
                  {mode === "llm" ? "AI 生成 · 已标注来源" : "模板草稿 · 已标注来源"}
                  {reportId ? " · 已保存" : ""}
                  {editedSaved ? " · 已改写" : ""}
                </span>
                <div className="flex items-center gap-2">
                  {editing ? (
                    <>
                      <button
                        type="button"
                        onClick={() => setEditing(false)}
                        className="inline-flex h-8 items-center rounded-full border border-line bg-card px-3 text-[11.5px] text-muted transition-colors hover:text-ink"
                      >
                        取消
                      </button>
                      <button
                        type="button"
                        onClick={finishEdit}
                        disabled={savingEdit}
                        className="inline-flex h-8 items-center gap-1.5 rounded-full bg-brand px-3 text-[11.5px] font-medium text-white transition-colors hover:bg-brand-deep disabled:opacity-60"
                      >
                        {savingEdit ? (
                          <Loader2 className="size-3.5 animate-spin" />
                        ) : (
                          <Check className="size-3.5" />
                        )}
                        完成
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      onClick={startEdit}
                      className="inline-flex h-8 items-center gap-1.5 rounded-full border border-line bg-card px-3 text-[11.5px] text-muted transition-colors hover:text-ink"
                    >
                      <Pencil className="size-3.5" />
                      编辑
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={copy}
                    disabled={editing}
                    className="inline-flex h-8 items-center gap-1.5 rounded-full border border-line bg-card px-3 text-[11.5px] text-muted transition-colors hover:text-ink disabled:opacity-50"
                  >
                    {copied ? (
                      <Check className="size-3.5 text-brand" />
                    ) : (
                      <Copy className="size-3.5" />
                    )}
                    {copied ? "已复制" : "复制"}
                  </button>
                  {demoMode ? (
                    <Link
                      href="/r/demo"
                      target="_blank"
                      className="inline-flex h-8 items-center gap-1.5 rounded-full border border-line bg-card px-3 text-[11.5px] text-muted transition-colors hover:text-ink"
                    >
                      <Share2 className="size-3.5" />
                      示例分享页
                    </Link>
                  ) : (
                    <button
                      type="button"
                      onClick={share}
                      disabled={!reportId || sharing}
                      className="inline-flex h-8 items-center gap-1.5 rounded-full border border-line bg-card px-3 text-[11.5px] text-muted transition-colors hover:text-ink disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {sharing ? (
                        <Loader2 className="size-3.5 animate-spin" />
                      ) : (
                        <Share2 className="size-3.5" />
                      )}
                      生成分享链接
                    </button>
                  )}
                </div>
              </div>

              {shareSlug ? (
                <button
                  type="button"
                  onClick={copyShareLink}
                  className="mb-4 flex w-full items-center gap-2 rounded-xl border border-brand/30 bg-brand-soft px-3 py-2 text-left text-[11.5px] text-brand-deep"
                >
                  <Link2 className="size-3.5 shrink-0" />
                  <span className="min-w-0 flex-1 truncate font-mono">
                    /r/{shareSlug}
                  </span>
                  <span className="shrink-0">
                    {copiedLink ? "已复制" : "复制链接"}
                  </span>
                </button>
              ) : null}

              {editing ? (
                <textarea
                  value={editDraft}
                  onChange={(event) => setEditDraft(event.target.value)}
                  rows={16}
                  spellCheck={false}
                  className="w-full resize-y rounded-xl border border-line bg-card p-3.5 font-mono text-[12.5px] leading-6 text-ink-soft outline-none transition-colors focus:border-brand"
                />
              ) : (
                <MarkdownView markdown={markdown} />
              )}

              <p className="mt-4 border-t border-line pt-3 text-[11px] text-muted/80">
                {editing
                  ? "直接改 Markdown 就行，点「完成」保存这次修改。"
                  : "生成的是初稿：把“（待补充）”换成你的话，再发出去。"}
              </p>
            </div>
          ) : (
            <div className="mt-4 rounded-2xl border border-dashed border-line bg-paper/40 px-5 py-12 text-center">
              <p className="text-[13px] text-ink-soft">
                记录越具体，生成的周报越像你。
              </p>
              <p className="mt-1 text-[11.5px] text-muted">
                先记两句，再点上面的按钮。
              </p>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
