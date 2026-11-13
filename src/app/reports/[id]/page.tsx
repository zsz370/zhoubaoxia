import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, Share2, ShieldCheck } from "lucide-react";
import { Logo } from "@/components/logo";
import { MarkdownView } from "@/components/markdown-view";
import { getSessionUser, isAuthConfigured } from "@/lib/auth";
import { perspectiveLabel } from "@/lib/perspectives";
import { getReport } from "@/lib/store";

export const dynamic = "force-dynamic";

const stampFmt = new Intl.DateTimeFormat("zh-CN", {
  timeZone: "Asia/Shanghai",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
});

export default async function ReportPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  if (!isAuthConfigured()) notFound();

  const user = await getSessionUser();
  if (!user) redirect("/login");

  const report = await getReport(user.id, id);
  if (!report) notFound();

  return (
    <div className="flex min-h-full flex-col">
      <header className="border-b border-line">
        <div className="mx-auto flex h-16 w-full max-w-4xl items-center justify-between px-5">
          <Logo />
          <div className="flex items-center gap-3">
            {report.shareSlug ? (
              <Link
                href={`/r/${report.shareSlug}`}
                className="inline-flex h-9 items-center gap-1.5 rounded-full border border-line px-3.5 text-[12.5px] text-muted transition-colors hover:text-ink"
              >
                <Share2 className="size-3.5" />
                分享页
              </Link>
            ) : null}
            <Link
              href="/dashboard"
              className="inline-flex h-9 items-center gap-1.5 rounded-full bg-ink px-3.5 text-[12.5px] font-medium text-white transition-colors hover:bg-ink/85"
            >
              <ArrowLeft className="size-3.5" />
              回到工作台
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl flex-1 px-5 py-10 sm:py-14">
        <article className="rounded-3xl border border-line bg-card p-6 sm:p-10">
          <div className="flex flex-wrap items-center gap-2.5 text-[11px] text-muted">
            <span className="rounded-full bg-brand-soft px-2.5 py-1 font-medium text-brand-deep">
              {perspectiveLabel(report.perspective)}
            </span>
            <span>{report.weekLabel}</span>
            <span className="inline-flex items-center gap-1">
              <ShieldCheck className="size-3.5 text-brand" />
              每条结论带来源
            </span>
          </div>

          <h1 className="mt-4 text-[24px] font-semibold tracking-tight sm:text-[28px]">
            {report.weekLabel} 周报
          </h1>
          <div className="mt-3 border-b border-line pb-6 text-[11.5px] text-muted">
            生成于 {stampFmt.format(new Date(report.createdAt))} ·
            仅你可见
          </div>

          <div className="mt-6">
            <MarkdownView markdown={report.contentMd} />
          </div>
        </article>
      </main>
    </div>
  );
}
