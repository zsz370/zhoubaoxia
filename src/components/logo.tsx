import Link from "next/link";
import { NotebookPen } from "lucide-react";

export function Logo({ href = "/" }: { href?: string }) {
  return (
    <Link href={href} className="group flex items-center gap-2.5">
      <span className="flex size-9 items-center justify-center rounded-[11px] bg-brand text-white shadow-[0_8px_20px_-10px_rgba(20,184,102,0.9)] transition-transform group-hover:-rotate-3">
        <NotebookPen size={18} strokeWidth={2.2} />
      </span>
      <span className="text-[15px] font-semibold tracking-tight text-ink">
        周报侠
      </span>
    </Link>
  );
}
