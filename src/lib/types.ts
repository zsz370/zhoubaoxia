export type Perspective = "up" | "self" | "team";

export function isPerspective(value: unknown): value is Perspective {
  return value === "up" || value === "self" || value === "team";
}

export interface NoteItem {
  id: string;
  content: string;
  /** 展示用日期，格式 MM/DD */
  date: string;
}

export type GithubEventType = "commit" | "pr" | "issue";

export interface GithubEvent {
  id: string;
  type: GithubEventType;
  title: string;
  repo: string;
  ref: string;
  /** 展示用日期，格式 MM/DD */
  date: string;
}

export interface GenerateRequest {
  perspective: Perspective;
  notes: NoteItem[];
  events: GithubEvent[];
}

export interface GenerateResponse {
  markdown: string;
  mode: "llm" | "template";
}
