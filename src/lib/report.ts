import type { GenerateRequest, GithubEvent, NoteItem } from "./types";

const RISK_KEYWORDS = ["卡", "阻塞", "风险", "延期", "依赖", "求助"];

function clean(text: string): string {
  return text.trim().replace(/[。；;]+$/, "");
}

function eventRef(event: GithubEvent): string {
  const prefix =
    event.type === "commit" ? "commit" : event.type === "pr" ? "PR" : "Issue";
  return `${prefix} ${event.ref} · ${event.repo}`;
}

function eventLine(event: GithubEvent): string {
  const verb =
    event.type === "commit"
      ? "提交"
      : event.type === "pr"
        ? "提交评审"
        : "跟进问题";
  return `- ${verb}「${event.title}」〔${eventRef(event)}〕`;
}

function noteLine(note: NoteItem): string {
  return `- ${clean(note.content)}〔记录 ${note.date}〕`;
}

function section(title: string, bullets: string[]): string {
  const body = bullets.length > 0 ? bullets.join("\n") : "- （待补充）";
  return `## ${title}\n\n${body}\n`;
}

function countEvents(events: GithubEvent[]) {
  return {
    commits: events.filter((event) => event.type === "commit").length,
    prs: events.filter((event) => event.type === "pr").length,
    issues: events.filter((event) => event.type === "issue").length,
  };
}

/**
 * 未配置 LLM 时的兜底生成：严格基于输入内容，不编造数据。
 */
export function buildTemplateReport(input: GenerateRequest): string {
  const { perspective, notes, events } = input;

  const eventBullets = events.slice(0, 6).map(eventLine);
  const noteBullets = notes.slice(0, 8).map(noteLine);
  const traceBullets = [...eventBullets, ...noteBullets];

  const riskBullets = notes
    .filter((note) =>
      RISK_KEYWORDS.some((keyword) => note.content.includes(keyword)),
    )
    .slice(0, 4)
    .map(noteLine);

  const { commits, prs, issues } = countEvents(events);
  const dataBullets = [
    `- 本周 ${commits} 次提交、${prs} 个 PR、${issues} 条 Issue`,
    `- 记录 ${notes.length} 条工作痕迹`,
  ];

  if (perspective === "self") {
    return [
      section("本周回顾", traceBullets),
      section(
        "卡点与思考",
        riskBullets.length > 0
          ? riskBullets
          : ["- 本周暂无记录在案的卡点。"],
      ),
      section("有效做法", [
        "- 回顾一条本周最有效的做法，写下下次可复用的步骤（待补充）",
      ]),
      section("下周调整", [
        "- 基于本周卡点，写一条下周要改变的具体行为（待补充）",
      ]),
    ].join("\n");
  }

  if (perspective === "team") {
    return [
      section("协作进展", traceBullets),
      section(
        "依赖与阻塞",
        riskBullets.length > 0
          ? riskBullets
          : ["- 本周暂无记录在案的依赖与阻塞。"],
      ),
      section("需要同步的决定", [
        "- （待补充）如需团队拍板，写清选项与截止时间",
      ]),
      section("下周协作", ["- （待补充）列出需要谁配合、什么时候要"]),
    ].join("\n");
  }

  return [
    section("本周结果", [...eventBullets.slice(0, 3), ...noteBullets.slice(0, 3)]),
    section("关键数据", dataBullets),
    section(
      "风险与求助",
      riskBullets.length > 0
        ? riskBullets
        : ["- 本周记录中未出现明显阻塞；如有遗漏，补一条记录后再生成。"],
    ),
    section("下周计划", [
      events[0]
        ? `- 完成「${events[0].title}」的后续验证与上线检查`
        : "- 补充下周的首要目标",
      "- 补充下周计划的具体目标与时间点（待补充）",
    ]),
  ].join("\n");
}
