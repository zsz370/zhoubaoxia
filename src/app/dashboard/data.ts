import { listEvents, listNotes, listRecentReports } from "@/lib/store";
import { getWeekBoundsUTC, getWeekLabel } from "@/lib/week";

export { type RecentReport } from "@/lib/store";

export async function loadDashboardData(userId: string) {
  const week = getWeekLabel();
  const bounds = getWeekBoundsUTC();

  const [notes, events, recentReports] = await Promise.all([
    listNotes(userId, week.startISO, week.endISO),
    listEvents(userId, bounds.from, bounds.to),
    listRecentReports(userId),
  ]);

  return { notes, events, recentReports };
}
