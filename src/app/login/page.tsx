import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, Check } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { getSessionUser, isAuthConfigured } from "@/lib/auth";

export const dynamic = "force-dynamic";

function GithubMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true" className={className} fill="currentColor">
      <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82a7.4 7.4 0 0 1 2.01-.27c.68 0 1.36.09 2.01.27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8Z" />
    </svg>
  );
}

const ERROR_TEXT: Record<string, string> = {
  oauth_not_configured: "服务端未配置 Appwrite，暂时无法登录",
  missing_code: "GitHub 没有返回授权码，请重试",
  missing_params: "授权参数缺失，请重新登录",
  state_mismatch: "授权状态校验失败，请重新登录",
  token_exchange_failed: "GitHub 凭据交换失败，请检查 OAuth App 配置",
  profile_failed: "读取 GitHub 账号信息失败，请重试",
  session_failed: "登录会话创建失败，请重试",
  oauth_failed: "GitHub 授权被取消或失败",
  network: "暂时连不上登录服务（网络被重置），请再点一次",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const authReady = isAuthConfigured();
  const { error } = await searchParams;

  if (authReady) {
    const user = await getSessionUser();
    if (user) redirect("/dashboard");
  }

  return (
    <>
      <SiteHeader
        action={
          <Link
            href="/dashboard"
            className="text-[13px] text-muted transition-colors hover:text-ink"
          >
            先看看演示
          </Link>
        }
      />

      <main className="mx-auto flex w-full max-w-5xl flex-1 items-center px-5 py-14">
        <div className="grid w-full overflow-hidden rounded-3xl border border-line bg-card md:grid-cols-[1.05fr_0.95fr]">
          <div className="border-b border-line bg-paper/60 p-8 sm:p-10 md:border-b-0 md:border-r">
            <h1 className="text-[26px] font-semibold tracking-tight">
              登录后，记录会跟着你走
            </h1>
            <p className="mt-3 text-[13px] leading-7 text-muted">
              每周的记录、生成过的周报、分享链接，都会保存在你的账号下。换一台电脑，接着写。
            </p>
            <ul className="mt-8 space-y-3 text-[13px] text-ink-soft">
              {[
                "本周痕迹自动归档，不用自己整理",
                "历史周报可回看、可再次编辑",
                "分享页随时关闭，内容由你掌控",
              ].map((item) => (
                <li key={item} className="flex items-center gap-2.5">
                  <Check className="size-4 shrink-0 text-brand" />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div className="p-8 sm:p-10">
            {authReady ? (
              <div className="flex h-full flex-col justify-center">
                <h2 className="text-[20px] font-semibold tracking-tight">
                  GitHub 登录
                </h2>
                <p className="mt-2 text-[13px] leading-7 text-muted">
                  不用密码，也不用邮箱验证码。登录由 Appwrite 托管，授权后即可进入工作台。
                </p>

                <a
                  href="/api/auth/github"
                  className="mt-6 inline-flex h-11 w-full items-center justify-center gap-2 rounded-full bg-ink text-sm font-medium text-white transition-colors hover:bg-ink/85"
                >
                  <GithubMark className="size-4" />
                  使用 GitHub 继续
                </a>

                {error ? (
                  <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-[12px] text-red-600">
                    {ERROR_TEXT[error] ?? `登录未完成（${error}）`}
                  </p>
                ) : null}

                <p className="mt-5 text-[11px] leading-6 text-muted/80">
                  仅申请读取账号信息的权限（read:user），不会修改你的仓库。
                </p>
              </div>
            ) : (
              <div className="flex h-full flex-col justify-center">
                <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-brand-soft px-2.5 py-1 text-[11px] font-medium text-brand-deep">
                  演示模式
                </span>
                <h2 className="mt-4 text-[20px] font-semibold tracking-tight">
                  先体验，再登录
                </h2>
                <p className="mt-2 text-[13px] leading-7 text-muted">
                  当前未配置 Appwrite，账号体系暂不可用。你仍然可以直接体验从记录到生成周报的完整流程。
                </p>
                <Link
                  href="/dashboard"
                  className="mt-6 inline-flex h-11 w-fit items-center gap-2 rounded-full bg-brand px-5 text-sm font-medium text-white transition-colors hover:bg-brand-deep"
                >
                  进入工作台
                  <ArrowRight className="size-4" />
                </Link>
                <p className="mt-6 font-mono text-[11px] leading-6 text-muted/80">
                  配置 APPWRITE_ENDPOINT、APPWRITE_PROJECT_ID、APPWRITE_API_KEY
                  后，这里会变为 GitHub 登录。
                </p>
              </div>
            )}
          </div>
        </div>
      </main>
    </>
  );
}
