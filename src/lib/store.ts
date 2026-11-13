import { ID, Permission, Query, Role } from "node-appwrite";
import { APPWRITE_DATABASE_ID, TABLES, adminTables } from "./appwrite";
import { eventRowId, type GithubEventDraft } from "./github";
import { perspectiveLabel } from "./perspectives";
import {
  isPerspective,
  type GithubEvent,
  type NoteItem,
  type Perspective,
} from "./types";

type Row = Record<string, unknown> & { $id: string };

function isoMMDD(value: string): string {
  return value.slice(5).replace("-", "/");
}

function userPermissions(userId: string): string[] {
  return [
    Permission.read(Role.user(userId)),
    Permission.update(Role.user(userId)),
    Permission.delete(Role.user(userId)),
  ];
}

async function listAll(table: string, queries: string[]): Promise<Row[]> {
  const result = await adminTables().listRows(
    APPWRITE_DATABASE_ID,
    table,
    queries,
  );
  return result.rows as unknown as Row[];
}

async function getRow(table: string, id: string): Promise<Row | null> {
  try {
    const row = await adminTables().getRow(
      APPWRITE_DATABASE_ID,
      table,
      id,
    );
    return row as unknown as Row;
  } catch {
    return null;
  }
}

export async function listNotes(
  userId: string,
  startISO: string,
  endISO: string,
): Promise<NoteItem[]> {
  const rows = await listAll(TABLES.notes, [
    Query.equal("userId", userId),
    Query.greaterThanEqual("noteDate", startISO),
    Query.lessThanEqual("noteDate", endISO),
    Query.limit(50),
  ]);

  return rows
    .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)))
    .map((row) => ({
      id: row.$id,
      content: String(row.content),
      date: isoMMDD(String(row.noteDate)),
    }));
}

export async function createNote(
  userId: string,
  content: string,
  dateISO: string,
): Promise<{ id: string; date: string }> {
  const row = await adminTables().createRow(
    APPWRITE_DATABASE_ID,
    TABLES.notes,
    ID.unique(),
    { userId, content, noteDate: dateISO, createdAt: new Date().toISOString() },
    userPermissions(userId),
  );

  return { id: row.$id, date: isoMMDD(dateISO) };
}

export async function deleteNote(
  userId: string,
  id: string,
): Promise<boolean> {
  const note = await getRow(TABLES.notes, id);
  if (!note || note.userId !== userId) return false;

  await adminTables().deleteRow(APPWRITE_DATABASE_ID, TABLES.notes, id);
  return true;
}

export async function listEvents(
  userId: string,
  fromISO: string,
  toISO: string,
): Promise<GithubEvent[]> {
  const rows = await listAll(TABLES.events, [
    Query.equal("userId", userId),
    Query.greaterThanEqual("occurredAt", fromISO),
    Query.lessThanEqual("occurredAt", toISO),
    Query.limit(100),
  ]);

  return rows
    .sort((a, b) => String(b.occurredAt).localeCompare(String(a.occurredAt)))
    .flatMap((row) => {
      const type = row.type;
      if (type !== "commit" && type !== "pr" && type !== "issue") return [];
      return [
        {
          id: row.$id,
          type,
          title: String(row.title),
          repo: String(row.repo),
          ref: String(row.ref),
          date: isoMMDD(String(row.occurredAt)),
        },
      ];
    });
}

/** 写入同步到的 GitHub 动态，按事件指纹去重 */
export async function saveGithubEvents(
  userId: string,
  drafts: GithubEventDraft[],
): Promise<number> {
  const tables = adminTables();
  let saved = 0;

  for (let index = 0; index < drafts.length; index += 5) {
    const batch = drafts.slice(index, index + 5);
    const results = await Promise.all(
      batch.map(async (draft) => {
        try {
          await tables.createRow(
            APPWRITE_DATABASE_ID,
            TABLES.events,
            eventRowId(draft),
            {
              userId,
              type: draft.type,
              title: draft.title,
              repo: draft.repo,
              ref: draft.ref,
              occurredAt: draft.occurredAt,
              createdAt: new Date().toISOString(),
            },
            userPermissions(userId),
          );
          return 1;
        } catch (error) {
          const code = (error as { code?: number }).code;
          if (code === 409) return 0;
          throw error;
        }
      }),
    );
    saved += results.reduce<number>((sum, value) => sum + value, 0);
  }

  return saved;
}

export interface RecentReport {
  id: string;
  perspective: Perspective;
  weekLabel: string;
  createdLabel: string;
  shareSlug: string | null;
}

export async function listRecentReports(
  userId: string,
  limit = 6,
): Promise<RecentReport[]> {
  const rows = await listAll(TABLES.reports, [
    Query.equal("userId", userId),
    Query.limit(50),
  ]);

  return rows
    .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)))
    .slice(0, limit)
    .flatMap((row) => {
      const perspective = row.perspective;
      if (!isPerspective(perspective)) return [];
      return [
        {
          id: row.$id,
          perspective,
          weekLabel: `${isoMMDD(String(row.weekStart))} - ${isoMMDD(
            String(row.weekEnd),
          )}`,
          createdLabel: isoMMDD(String(row.createdAt).slice(0, 10)),
          shareSlug: row.shareSlug ? String(row.shareSlug) : null,
        },
      ];
    });
}

export async function createReport(
  userId: string,
  perspective: Perspective,
  weekStart: string,
  weekEnd: string,
  contentMd: string,
  mode: "llm" | "template",
): Promise<string> {
  const row = await adminTables().createRow(
    APPWRITE_DATABASE_ID,
    TABLES.reports,
    ID.unique(),
    {
      userId,
      perspective,
      weekStart,
      weekEnd,
      contentMd,
      mode,
      createdAt: new Date().toISOString(),
    },
    userPermissions(userId),
  );

  return row.$id;
}

export interface ReportDetail {
  contentMd: string;
  perspective: Perspective;
  weekLabel: string;
  createdAt: string;
  shareSlug: string | null;
}

export async function getReport(
  userId: string,
  id: string,
): Promise<ReportDetail | null> {
  const row = await getRow(TABLES.reports, id);
  if (!row || row.userId !== userId) return null;

  const perspective = row.perspective;
  if (!isPerspective(perspective)) return null;

  return {
    contentMd: String(row.contentMd),
    perspective,
    weekLabel: `${isoMMDD(String(row.weekStart))} - ${isoMMDD(
      String(row.weekEnd),
    )}`,
    createdAt: String(row.createdAt),
    shareSlug: row.shareSlug ? String(row.shareSlug) : null,
  };
}

export async function updateReportContent(
  userId: string,
  reportId: string,
  contentMd: string,
): Promise<boolean> {
  const report = await getRow(TABLES.reports, reportId);
  if (!report || report.userId !== userId) return false;

  await adminTables().updateRow(
    APPWRITE_DATABASE_ID,
    TABLES.reports,
    reportId,
    { contentMd },
  );
  return true;
}

export async function createShare(
  userId: string,
  reportId: string,
): Promise<{ slug: string } | null> {
  const report = await getRow(TABLES.reports, reportId);
  if (!report || report.userId !== userId) return null;

  const perspective = report.perspective;
  if (!isPerspective(perspective)) return null;

  const weekLabel = `${isoMMDD(String(report.weekStart))} - ${isoMMDD(
    String(report.weekEnd),
  )}`;

  const slug = `r${Date.now().toString(36)}${Math.floor(Math.random() * 1e6)
    .toString(36)
    .padStart(4, "0")}`;

  await adminTables().createRow(
    APPWRITE_DATABASE_ID,
    TABLES.shares,
    slug,
    {
      reportId,
      userId,
      title: `${perspectiveLabel(perspective)} · ${weekLabel}`,
      contentMd: String(report.contentMd),
      perspective,
      weekLabel,
      createdAt: new Date().toISOString(),
    },
    [Permission.read(Role.any())],
  );

  await adminTables().updateRow(
    APPWRITE_DATABASE_ID,
    TABLES.reports,
    reportId,
    { shareSlug: slug },
  );

  return { slug };
}

export interface ShareDetail {
  title: string;
  markdown: string;
  perspective: Perspective;
  weekLabel: string | null;
}

export async function getShare(slug: string): Promise<ShareDetail | null> {
  if (!/^[a-z0-9]{6,32}$/.test(slug)) return null;

  const row = await getRow(TABLES.shares, slug);
  if (!row) return null;

  const perspective = row.perspective;
  if (!isPerspective(perspective)) return null;

  return {
    title: row.title ? String(row.title) : "一份周报",
    markdown: String(row.contentMd),
    perspective,
    weekLabel: row.weekLabel ? String(row.weekLabel) : null,
  };
}
