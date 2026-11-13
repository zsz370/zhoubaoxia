import Link from "next/link";
import {
  ArrowRight,
  Check,
  Clock,
  GitBranch,
  GitPullRequest,
  PenLine,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { Logo } from "@/components/logo";
import { PERSPECTIVES } from "@/lib/perspectives";
import type { Perspective } from "@/lib/types";

const pains = [
  {
    icon: Clock,
    title: "想不起来",
    desc: "提交散在 Git，进展散在聊天，周五只剩一句“本周正常推进”。",
  },
  {
    icon: PenLine,
    title: "写不像样",
    desc: "明明是干活的人，写出来却像流水账，关键结果被埋在细节里。",
  },
  {
    icon: GitBranch,
    title: "一份不够",
    desc: "老板要结果，自己要复盘，团队要同步——同一周的事要写三遍。",
  },
];

const steps = [
  {
    n: "01",
    icon: GitBranch,
    title: "接入工作痕迹",
    desc: "连接 GitHub，自动读取本周提交、PR 与 Issue；不写代码也能用随手记录。",
  },
  {
    n: "02",
    icon: PenLine,
    title: "随手记一句",
    desc: "开会、对齐、踩坑，一句话就够。记录时不必想好怎么写进周报。",
  },
  {
    n: "03",
    icon: Sparkles,
    title: "一键成稿",
    desc: "选一个视角，30 秒生成初稿。复制到飞书、钉钉，或直接生成分享链接。",
  },
];

const perspectiveSamples: Record<Perspective, string> = {
  up: "完成订单导出（试点客户），覆盖首批试用账号〔PR #128〕",
  self: "卡点：联调排期与设计交付错位，多等了两天。",
  team: "依赖：等后端提供退款回调沙箱环境，预计周三。",
};

export default function Home() {
  return (
    <>
      <SiteHeader
        action={
          <div className="flex items-center gap-3">
            <Link
              href="/r/demo"
              className="hidden text-[13px] text-muted transition-colors hover:text-ink sm:block"
            >
              示例周报
            </Link>
            <Link
              href="/dashboard"
              className="inline-flex h-9 items-center gap-1.5 rounded-full bg-ink px-4 text-[13px] font-medium text-white transition-colors hover:bg-ink/85"
            >
              进入工作台
              <ArrowRight className="size-3.5" />
            </Link>
          </div>
        }
      />

      <main className="flex-1">
        {/* Hero */}
        <section className="mx-auto w-full max-w-6xl px-5 pb-20 pt-14 sm:pt-20">
          <div className="grid items-center gap-14 lg:grid-cols-[1.05fr_0.95fr]">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full border border-line bg-card px-3 py-1 text-xs text-muted">
                <Sparkles className="size-3.5 text-brand" />
                TRAE 好应用大赏赛 · 效率工具
              </span>

              <h1 className="mt-6 text-[42px] font-semibold leading-[1.12] tracking-tight sm:text-[58px]">
                别再憋
                <span className="relative inline-block">
                  <span className="absolute inset-x-0 bottom-1 h-3 rounded-full bg-brand/25" />
                  <span className="relative">周报</span>
                </span>
                了。
              </h1>

              <p className="mt-6 max-w-xl text-[15px] leading-8 text-ink-soft">
                周报侠会把你这一周的 Git 提交和随手记录，整理成三份周报——给老板看的、给自己看的、给团队看的。30
                秒出初稿，每条结论都有出处。
              </p>

              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Link
                  href="/demo"
                  className="inline-flex h-11 items-center gap-2 rounded-full bg-brand px-6 text-sm font-medium text-white shadow-[0_14px_30px_-14px_rgba(20,184,102,0.9)] transition-colors hover:bg-brand-deep"
                >
                  免登录试用，30 秒出稿
                  <ArrowRight className="size-4" />
                </Link>
                <Link
                  href="/r/demo"
                  className="inline-flex h-11 items-center rounded-full border border-line bg-card px-6 text-sm text-ink transition-colors hover:border-ink/20"
                >
                  看看示例周报
                </Link>
              </div>

              <div className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-xs text-muted">
                {["无需登录即可体验", "每条结论可溯源", "不编造你的工作"].map(
                  (item) => (
                    <span key={item} className="inline-flex items-center gap-1.5">
                      <Check className="size-3.5 text-brand" />
                      {item}
                    </span>
                  ),
                )}
              </div>
            </div>

            {/* 周报预览 */}
            <div className="relative">
              <div className="absolute -inset-6 rounded-[40px] bg-[radial-gradient(60%_60%_at_50%_35%,rgba(20,184,102,0.18),transparent_72%)] blur-2xl" />
              <div className="relative rounded-3xl border border-line bg-card p-6 shadow-[0_36px_70px_-48px_rgba(20,22,15,0.5)]">
                <div className="flex items-center justify-between">
                  <span className="rounded-full bg-brand-soft px-2.5 py-1 text-[11px] font-medium text-brand-deep">
                    向上汇报 · 本周
                  </span>
                  <span className="text-[11px] text-muted">28 秒生成</span>
                </div>

                <h3 className="mt-5 flex items-center gap-2 text-[15px] font-semibold">
                  <span className="h-3.5 w-[3px] rounded-full bg-brand" />
                  本周结果
                </h3>
                <ul className="mt-3 space-y-2.5 text-[12.5px] leading-6 text-ink-soft">
                  {[
                    ["提交评审「订单导出（试点客户）」", "PR #128"],
                    ["支付回调改为幂等处理，补充 3 个单测", "commit 3f2a1c"],
                    ["与设计对齐空状态，周五前给终稿", "记录 11/10"],
                  ].map(([text, ref]) => (
                    <li key={ref} className="flex gap-2">
                      <span className="mt-[9px] size-1.5 shrink-0 rounded-full bg-brand/70" />
                      <span>
                        {text}
                        <span className="ml-1.5 rounded bg-brand-soft px-1 py-0.5 align-middle font-mono text-[10px] text-brand-deep">
                          {ref}
                        </span>
                      </span>
                    </li>
                  ))}
                </ul>

                <h3 className="mt-5 flex items-center gap-2 text-[15px] font-semibold">
                  <span className="h-3.5 w-[3px] rounded-full bg-sun" />
                  风险与求助
                </h3>
                <p className="mt-2 text-[12.5px] leading-6 text-ink-soft">
                  退款联调卡在沙箱环境，后端预计本周内解决
                  <span className="ml-1.5 rounded bg-brand-soft px-1 py-0.5 align-middle font-mono text-[10px] text-brand-deep">
                    记录 11/09
                  </span>
                </p>

                <div className="mt-6 flex items-center justify-between border-t border-line pt-4 text-[11px] text-muted">
                  <span className="inline-flex items-center gap-1.5">
                    <ShieldCheck className="size-3.5 text-brand" />
                    证据链 3/3 · 可核对
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <GitPullRequest className="size-3.5" />
                    可生成分享链接
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 痛点 */}
        <section className="border-y border-line bg-card/60">
          <div className="mx-auto w-full max-w-6xl px-5 py-16">
            <h2 className="text-center text-[26px] font-semibold tracking-tight sm:text-[30px]">
              一周的努力，不该死在周五下午
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-center text-sm leading-7 text-muted">
              周报的痛苦不是“不会写”，而是记录、整理、换视角，每一步都在消耗你。
            </p>

            <div className="mt-10 grid gap-4 md:grid-cols-3">
              {pains.map((pain) => {
                const Icon = pain.icon;
                return (
                  <div
                    key={pain.title}
                    className="rounded-2xl border border-line bg-card p-6"
                  >
                    <span className="flex size-10 items-center justify-center rounded-xl bg-paper text-ink-soft">
                      <Icon className="size-[18px]" />
                    </span>
                    <h3 className="mt-4 text-[15px] font-semibold">
                      {pain.title}
                    </h3>
                    <p className="mt-2 text-[13px] leading-6 text-muted">
                      {pain.desc}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* 三步 */}
        <section className="mx-auto w-full max-w-6xl px-5 py-20">
          <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <span className="text-xs font-medium uppercase tracking-[0.2em] text-brand-deep">
                How it works
              </span>
              <h2 className="mt-2 text-[28px] font-semibold tracking-tight sm:text-[32px]">
                三步，从空白到成稿
              </h2>
            </div>
            <p className="max-w-sm text-sm leading-7 text-muted">
              不改变你的工作方式，只是把你已经做过的事，整理成说得出口的话。
            </p>
          </div>

          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {steps.map((step) => {
              const Icon = step.icon;
              return (
                <div
                  key={step.n}
                  className="group rounded-2xl border border-line bg-card p-6 transition-colors hover:border-brand/40"
                >
                  <div className="flex items-center justify-between">
                    <span className="flex size-10 items-center justify-center rounded-xl bg-brand-soft text-brand-deep">
                      <Icon className="size-[18px]" />
                    </span>
                    <span className="font-mono text-xs text-muted/70">
                      {step.n}
                    </span>
                  </div>
                  <h3 className="mt-4 text-[15px] font-semibold">
                    {step.title}
                  </h3>
                  <p className="mt-2 text-[13px] leading-6 text-muted">
                    {step.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </section>

        {/* 三视角 */}
        <section
          id="perspectives"
          className="border-y border-line bg-card/60"
        >
          <div className="mx-auto w-full max-w-6xl px-5 py-20">
            <div className="text-center">
              <span className="text-xs font-medium uppercase tracking-[0.2em] text-brand-deep">
                Three perspectives
              </span>
              <h2 className="mt-2 text-[28px] font-semibold tracking-tight sm:text-[32px]">
                同一周，三种说法
              </h2>
              <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-muted">
                事实只有一份，但老板、自己、同事想看的东西不一样。选一个视角，剩下的交给周报侠。
              </p>
            </div>

            <div className="mt-10 grid gap-4 md:grid-cols-3">
              {PERSPECTIVES.map((item) => (
                <div
                  key={item.id}
                  className="flex flex-col rounded-2xl border border-line bg-card p-6"
                >
                  <div className="flex items-center justify-between">
                    <h3 className="text-[15px] font-semibold">{item.label}</h3>
                    <span className="rounded-full bg-paper px-2 py-0.5 text-[11px] text-muted">
                      {item.audience}
                    </span>
                  </div>
                  <p className="mt-2 text-[13px] leading-6 text-muted">
                    {item.hint}
                  </p>
                  <div className="mt-4 rounded-xl bg-paper/80 p-4 text-[12px] leading-6 text-ink-soft">
                    “{perspectiveSamples[item.id]}”
                  </div>
                  <p className="mt-auto pt-4 font-mono text-[10.5px] leading-5 text-muted/80">
                    {item.sections}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 证据链 */}
        <section className="mx-auto w-full max-w-6xl px-5 py-20">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full border border-line bg-card px-3 py-1 text-xs text-muted">
                <ShieldCheck className="size-3.5 text-brand" />
                证据链
              </span>
              <h2 className="mt-5 text-[28px] font-semibold tracking-tight sm:text-[32px]">
                每条结论，
                <br className="hidden sm:block" />
                都能追到源头
              </h2>
              <p className="mt-4 max-w-lg text-sm leading-7 text-muted">
                我们不希望 AI 替你编故事。周报里的每条结论后面都跟着来源标记——一条记录、一次提交、一个
                PR，随时可以核对。周报是你说过的话，不是模型想象的话。
              </p>
              <ul className="mt-6 space-y-3 text-[13px] text-ink-soft">
                {[
                  "只使用你提供的记录与 GitHub 动态",
                  "信息不足的板块标记“待补充”，不虚构",
                  "生成后仍可编辑，最终口径由你决定",
                ].map((item) => (
                  <li key={item} className="flex items-center gap-2.5">
                    <Check className="size-4 shrink-0 text-brand" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-2xl border border-line bg-card p-6">
              <p className="text-[13px] leading-7 text-ink-soft">
                支付回调改为幂等处理，补充 3 个单元测试
                <span className="ml-1.5 inline-flex items-center rounded-md bg-brand-soft px-1.5 py-0.5 align-[1px] font-mono text-[10.5px] text-brand-deep">
                  commit 3f2a1c
                </span>
              </p>
              <div className="mt-5 space-y-2 border-t border-line pt-5">
                {[
                  ["来源 · 随手记录", "11/10 21:36", true],
                  ["来源 · GitHub commit", "acme/pay-service · 3f2a1c", true],
                  ["来源 · 关联 PR", "#128 · 已合并", true],
                ].map(([label, meta]) => (
                  <div
                    key={String(label)}
                    className="flex items-center justify-between rounded-xl bg-paper/70 px-3.5 py-2.5"
                  >
                    <span className="text-[12px] text-ink-soft">
                      {label as string}
                    </span>
                    <span className="font-mono text-[10.5px] text-muted">
                      {meta as string}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* 底部 CTA */}
        <section className="mx-auto w-full max-w-6xl px-5 pb-20">
          <div className="relative overflow-hidden rounded-3xl bg-ink px-6 py-14 text-center text-white sm:px-10">
            <div className="absolute -top-24 left-1/2 h-64 w-[520px] -translate-x-1/2 rounded-full bg-brand/25 blur-3xl" />
            <div className="relative">
              <h2 className="text-[26px] font-semibold tracking-tight sm:text-[32px]">
                本周的周报，从这一条记录开始。
              </h2>
              <p className="mx-auto mt-3 max-w-md text-[13px] leading-7 text-white/65">
                不用等到周五。先记一句，剩下的交给周报侠。
              </p>
              <Link
                href="/dashboard"
                className="mt-8 inline-flex h-11 items-center gap-2 rounded-full bg-brand px-6 text-sm font-medium text-white transition-colors hover:bg-brand/90"
              >
                打开工作台
                <ArrowRight className="size-4" />
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-line">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-start justify-between gap-4 px-5 py-8 sm:flex-row sm:items-center">
          <Logo />
          <p className="text-xs text-muted">
            为 TRAE 好应用大赏赛而做 · 2026
          </p>
        </div>
      </footer>
    </>
  );
}
