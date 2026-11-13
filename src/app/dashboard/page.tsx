import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowUpRight, LogOut, Share2 } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { getSessionUser, isAuthConfigured } from "@/lib/auth";
import { perspectiveLabel } from "@/lib/perspectives";
import { sampleEvents, sampleNotes } from "@/lib/sample";
import { getWeekLabel } from "@/lib/week";
import { signOutAction } from "@/app/actions";
import { loadDashboardData } from "./data";
import { Workbench } from "./workbench";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const authReady = isAuthConfigured();
  const user = authReady ? await getSessionUser() : null;
  if (authReady && !user) redirect("/login");

  const week = getWeekLabel();
  const demoMode = !user;
  const { notes, events, recentReports } = user
    ? await loadDashboardData(user.id)
    : { notes: sampleNotes, events: sampleEvents, recentReports: [] };

  return (
    <>
      <SiteHeader
        action={
          user ? (
            <div className="flex items-center gap-3">
              <span className="hidden max-w-[220px] truncate text-xs text-muted sm:block">
                {user.name ?? "已登录"}
              </span>
              <form action={signOutAction}>
                <button
                  type="submit"
                  className="inline-flex h-8 items-center gap-1.5 rounded-full border border-line px-3 text-xs text-muted transition-colors hover:text-ink"
                >
                  <LogOut className="size-3.5" />
                  退出
                </button>
              </form>
            </div>
          ) : (
            <Link
              href="/login"
              className="text-[13px] text-muted transition-colors hover:text-ink"
            >
              登录
            </Link>
          )
        }
      />

      <Workbench
        demoMode={demoMode}
        weekRange={week.range}
        initialNotes={notes}
        events={events}
        githubUsername={user?.githubUsername ?? null}
      />

      {recentReports.length > 0 ? (
        <section className="mx-auto w-full max-w-6xl px-5 pb-12">
          <h2 className="text-[15px] font-semibold">最近生成</h2>
          <p className="mt-0.5 text-[11.5px] text-muted">
            历史周报保存在你的账号下，可随时回看
          </p>
          <ul className="mt-3 divide-y divide-line overflow-hidden rounded-2xl border border-line bg-card">
            {recentReports.map((report) => (
              <li
                key={report.id}
                className="flex flex-wrap items-center gap-3 px-4 py-3"
              >
                <span className="rounded-full bg-brand-soft px-2.5 py-1 text-[11px] font-medium text-brand-deep">
                  {perspectiveLabel(report.perspective)}
                </span>
                <span className="text-[12.5px] text-ink-soft">
                  {report.weekLabel}
                </span>
                <span className="font-mono text-[10.5px] text-muted">
                  生成于 {report.createdLabel}
                </span>
                <div className="ml-auto flex items-center gap-3 text-[11.5px]">
                  {report.shareSlug ? (
                    <Link
                      href={`/r/${report.shareSlug}`}
                      className="inline-flex items-center gap-1 text-muted transition-colors hover:text-ink"
                    >
                      <Share2 className="size-3.5" />
                      分享页
                    </Link>
                  ) : null}
                  <Link
                    href={`/reports/${report.id}`}
                    className="inline-flex items-center gap-1 text-ink-soft transition-colors hover:text-ink"
                  >
                    查看
                    <ArrowUpRight className="size-3.5" />
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </>
  );
}
