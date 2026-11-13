const dateFmt = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Asia/Shanghai",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

function toUTCDay(date: Date): number {
  const [year, month, day] = dateFmt.format(date).split("-").map(Number);
  return Date.UTC(year, month - 1, day);
}

function mmdd(ms: number): string {
  const date = new Date(ms);
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  return `${month}/${day}`;
}

function isoDay(ms: number): string {
  return new Date(ms).toISOString().slice(0, 10);
}

/** 以周一为一周起点，返回本周的范围（展示用 MM/DD 与数据库用 ISO 日期） */
export function getWeekLabel(now = new Date()) {
  const today = toUTCDay(now);
  const offset = (new Date(today).getUTCDay() + 6) % 7;
  const start = today - offset * 86_400_000;
  const end = start + 6 * 86_400_000;
  return {
    start: mmdd(start),
    end: mmdd(end),
    range: `${mmdd(start)} - ${mmdd(end)}`,
    startISO: isoDay(start),
    endISO: isoDay(end),
  };
}

export function todayMMDD(): string {
  return mmdd(toUTCDay(new Date()));
}

/** 上海时区的今天，格式 YYYY-MM-DD */
export function todayISO(): string {
  return isoDay(toUTCDay(new Date()));
}

/** 本周起止时间，转为 UTC ISO，用于数据库时间戳比较 */
export function getWeekBoundsUTC(now = new Date()) {
  const { startISO, endISO } = getWeekLabel(now);
  return {
    from: new Date(`${startISO}T00:00:00+08:00`).toISOString(),
    to: new Date(`${endISO}T23:59:59.999+08:00`).toISOString(),
  };
}
