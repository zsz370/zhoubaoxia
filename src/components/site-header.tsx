import Link from "next/link";
import type { ReactNode } from "react";
import { Logo } from "./logo";

export function SiteHeader({ action }: { action?: ReactNode }) {
  return (
    <header className="sticky top-0 z-40 border-b border-line/80 bg-paper/85 backdrop-blur">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-5">
        <div className="flex items-center gap-8">
          <Logo />
          <nav className="hidden items-center gap-6 text-[13px] text-muted md:flex">
            <Link
              href="/dashboard"
              className="transition-colors hover:text-ink"
            >
              工作台
            </Link>
            <Link href="/demo" className="transition-colors hover:text-ink">
              游客体验
            </Link>
            <Link href="/r/demo" className="transition-colors hover:text-ink">
              示例周报
            </Link>
            <Link
              href="/#perspectives"
              className="transition-colors hover:text-ink"
            >
              三视角
            </Link>
          </nav>
        </div>
        {action}
      </div>
    </header>
  );
}
