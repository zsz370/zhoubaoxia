import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, ShieldCheck } from "lucide-react";
import { Logo } from "@/components/logo";
import { MarkdownView } from "@/components/markdown-view";
import { perspectiveLabel } from "@/lib/perspectives";
import { demoReport } from "@/lib/sample";
import { getShare } from "@/lib/store";
import type { Perspective } from "@/lib/types";

export const dynamic = "force-dynamic";

interface ShareData {
  title: string;
  markdown: string;
  perspective: Perspective;
  weekLabel: string | null;
}

function demoShare(): ShareData {
  return {
    title: "订单导出与支付稳定性周报",
    markdown: demoReport,
    perspective: "up",
    weekLabel: "11/09 - 11/15",
  };
}

async function getShareDetail(slug: string): Promise<ShareData | null> {
  const share = await getShare(slug);
  if (!share) return null;

  return {
    title: share.title,
    markdown: share.markdown,
    perspective: share.perspective,
    weekLabel: share.weekLabel,
  };
}

export default async function SharePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const share = slug === "demo" ? demoShare() : await getShareDetail(slug);
  if (!share) notFound();

  return (
    <div className="flex min-h-full flex-col">
      <header className="border-b border-line">
        <div className="mx-auto flex h-16 w-full max-w-4xl items-center justify-between px-5">
          <Logo />
          <Link
            href="/dashboard"
            className="inline-flex h-9 items-center gap-1.5 rounded-full bg-ink px-3.5 text-[12.5px] font-medium text-white transition-colors hover:bg-ink/85"
          >
            我也要生成
            <ArrowRight className="size-3.5" />
          </Link>
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl flex-1 px-5 py-10 sm:py-14">
        <article className="rounded-3xl border border-line bg-card p-6 sm:p-10">
          <div className="flex flex-wrap items-center gap-2.5 text-[11px] text-muted">
            <span className="rounded-full bg-brand-soft px-2.5 py-1 font-medium text-brand-deep">
              {perspectiveLabel(share.perspective)}
            </span>
            {share.weekLabel ? <span>{share.weekLabel}</span> : null}
            <span className="inline-flex items-center gap-1">
              <ShieldCheck className="size-3.5 text-brand" />
              每条结论带来源
            </span>
          </div>

          <h1 className="mt-4 text-[26px] font-semibold tracking-tight sm:text-[30px]">
            {share.title}
          </h1>
          <div className="mt-3 border-b border-line pb-6 text-[11.5px] text-muted">
            由周报侠生成并分享
          </div>

          <div className="mt-6">
            <MarkdownView markdown={share.markdown} />
          </div>
        </article>

        <p className="mt-6 text-center text-xs text-muted">
          周报侠 · 把工作痕迹变成说得出口的话
        </p>
      </main>
    </div>
  );
}
