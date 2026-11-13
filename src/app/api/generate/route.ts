import { isLlmConfigured } from "@/lib/env";
import { PERSPECTIVES } from "@/lib/perspectives";
import { buildTemplateReport } from "@/lib/report";
import {
  isPerspective,
  type GenerateRequest,
  type GithubEvent,
  type NoteItem,
} from "@/lib/types";

const SYSTEM_PROMPT = `你是一名资深职场写作助手，帮用户把零散的工作痕迹整理成周报。

规则：
1. 只能使用用户提供的记录与 GitHub 动态，不得编造数字、人名或项目进展。
2. 每条结论后用〔〕标注来源，格式如〔记录 11/10〕或〔commit 3f2a1c〕。
3. 输出 Markdown，使用 3-4 个二级标题（##），不要输出一级标题。
4. 语气克制、具体，避免“赋能”“闭环”“抓手”这类空话。
5. 信息不足的板块写“（待补充）”，不要虚构。`;

function parseNotes(value: unknown): NoteItem[] {
  if (!Array.isArray(value)) return [];

  return value
    .flatMap<NoteItem>((item) => {
      if (typeof item !== "object" || item === null) return [];
      const record = item as Record<string, unknown>;
      const content =
        typeof record.content === "string"
          ? record.content.trim().slice(0, 200)
          : "";
      const date =
        typeof record.date === "string" ? record.date.slice(0, 10) : "";
      if (!content) return [];
      return [{ id: "", content, date: date || "本周" }];
    })
    .slice(0, 50);
}

function parseEvents(value: unknown): GithubEvent[] {
  if (!Array.isArray(value)) return [];

  return value
    .flatMap<GithubEvent>((item) => {
      if (typeof item !== "object" || item === null) return [];
      const record = item as Record<string, unknown>;
      const type = record.type;
      if (type !== "commit" && type !== "pr" && type !== "issue") return [];
      const title =
        typeof record.title === "string" ? record.title.trim().slice(0, 160) : "";
      const repo =
        typeof record.repo === "string" ? record.repo.trim().slice(0, 80) : "";
      const ref =
        typeof record.ref === "string" ? record.ref.trim().slice(0, 40) : "";
      const date =
        typeof record.date === "string" ? record.date.slice(0, 10) : "";
      if (!title) return [];
      return [{ id: "", type, title, repo, ref, date: date || "本周" }];
    })
    .slice(0, 100);
}

async function generateWithLlm(input: GenerateRequest): Promise<string> {
  const baseUrl = (process.env.LLM_BASE_URL ?? "https://api.openai.com/v1").replace(
    /\/$/,
    "",
  );
  const meta =
    PERSPECTIVES.find((item) => item.id === input.perspective) ??
    PERSPECTIVES[0];

  const notesText =
    input.notes.map((note) => `- ${note.date}：${note.content}`).join("\n") ||
    "（无）";
  const eventsText =
    input.events
      .map(
        (event) =>
          `- ${event.type} ${event.ref}：${event.title}（${event.repo}，${event.date}）`,
      )
      .join("\n") || "（无）";

  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.LLM_API_KEY}`,
    },
    body: JSON.stringify({
      model: process.env.LLM_MODEL,
      temperature: 0.3,
      max_tokens: 1200,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        {
          role: "user",
          content: `视角：${meta.label}（${meta.audience}）\n建议结构：${meta.sections}\n\n工作记录：\n${notesText}\n\nGitHub 动态：\n${eventsText}`,
        },
      ],
    }),
    signal: AbortSignal.timeout(30_000),
  });

  if (!response.ok) {
    throw new Error(`LLM 接口返回 ${response.status}`);
  }

  const data = (await response.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  const content = data.choices?.[0]?.message?.content?.trim();
  if (!content) throw new Error("LLM 返回内容为空");
  return content;
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as {
    perspective?: unknown;
    notes?: unknown;
    events?: unknown;
  } | null;

  if (!body || !isPerspective(body.perspective)) {
    return Response.json({ error: "参数不合法" }, { status: 400 });
  }

  const input: GenerateRequest = {
    perspective: body.perspective,
    notes: parseNotes(body.notes),
    events: parseEvents(body.events),
  };

  if (input.notes.length === 0 && input.events.length === 0) {
    return Response.json({ error: "先记录一点内容，再生成周报" }, { status: 400 });
  }

  if (isLlmConfigured()) {
    try {
      const markdown = await generateWithLlm(input);
      return Response.json({ markdown, mode: "llm" });
    } catch (error) {
      console.error("LLM 生成失败，已回退模板：", error);
    }
  }

  return Response.json({ markdown: buildTemplateReport(input), mode: "template" });
}
