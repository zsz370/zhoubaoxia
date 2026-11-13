import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { Workbench } from "@/app/dashboard/workbench";
import { sampleEvents, sampleNotes } from "@/lib/sample";
import { getWeekLabel } from "@/lib/week";

export const metadata = {
  title: "演示 · 周报侠",
  description: "不用登录，直接用示例数据体验从记录到生成周报的完整流程。",
};

export default function DemoPage() {
  const week = getWeekLabel();

  return (
    <>
      <SiteHeader
        action={
          <Link
            href="/login"
            className="text-[13px] text-muted transition-colors hover:text-ink"
          >
            登录，用自己的数据
          </Link>
        }
      />

      <Workbench
        demoMode
        weekRange={week.range}
        initialNotes={sampleNotes}
        events={sampleEvents}
        githubUsername={null}
      />
    </>
  );
}
