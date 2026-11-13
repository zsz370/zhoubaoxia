# 周报侠

把一周的工作痕迹，整理成三份能直接发出去的周报。

> 同一份事实，换三种说法：向上汇报看结果，自我复盘看经验，团队协作看依赖。

## 它解决什么

- **想不起来**：提交散在 Git、进展散在聊天，周五只剩一句「本周正常推进」
- **写不像样**：明明是干活的人，写出来却像流水账
- **一份不够**：老板要结果、自己要复盘、团队要同步，同一周的事要写三遍

## 功能

- **三视角生成**：向上汇报 / 自我复盘 / 团队协作，各自有对应的结构和语气
- **GitHub 动态同步**：读取公开的提交、PR、Issue，按事件指纹去重，只取本周
- **证据链**：每条结论后面标注来源（`记录 11/12`、`commit 3f2a1c`、`PR #128`），不使用没有出处的信息
- **生成后可编辑**：直接在 Markdown 里改，保存后写回历史周报
- **分享页**：一键生成只读链接，对方无需登录
- **免登录体验**：访问 `/demo` 用示例数据走完整流程

## 技术栈

- Next.js 16（App Router）+ React 19 + TypeScript + Tailwind CSS 4
- Appwrite Cloud：用户登录（GitHub OAuth）、数据库（TablesDB）、会话
- 大模型：任意 OpenAI 兼容接口（默认配阿里云百炼 `deepseek-v4.1-flash`）
- 部署：Node 自托管（PM2 + Nginx），也可跑在任意支持 Node 的平台

## 快速开始

```bash
npm install
cp .env.example .env.local   # Windows: copy .env.example .env.local
# 填写 .env.local 中的 Appwrite 与模型配置
npm run setup:db             # 自动创建数据库、表、字段与索引
npm run dev
```

打开 http://localhost:3000 ，`/demo` 可直接体验，`/login` 走 GitHub 登录。

## 环境变量

| 变量 | 必填 | 说明 |
| --- | --- | --- |
| `APPWRITE_ENDPOINT` | 是 | 例如 `https://sgp.cloud.appwrite.io/v1` |
| `APPWRITE_PROJECT_ID` | 是 | Appwrite 项目 ID |
| `APPWRITE_API_KEY` | 是 | 服务端 Key，需要 Databases（TablesDB）读写与 Account 会话权限 |
| `APPWRITE_DATABASE_ID` | 否 | 默认 `zhoubaoxia` |
| `NEXT_PUBLIC_SITE_URL` | 是 | 站点地址，用于 OAuth 回调与分享链接 |
| `LLM_BASE_URL` | 否 | OpenAI 兼容接口地址，阿里云：`https://dashscope.aliyuncs.com/compatible-mode/v1` |
| `LLM_API_KEY` | 否 | 模型 Key；不配置时使用内置模板兜底 |
| `LLM_MODEL` | 否 | 模型名，例如 `deepseek-v4.1-flash` |
| `GITHUB_TOKEN` | 否 | 只读 Token，用于提高 GitHub 公开动态接口的限额（匿名 60 次/小时） |

## Appwrite 配置

1. 新建项目，区域建议 Singapore
2. 创建 API Key，勾选 TablesDB（`tables.*`、`rows.*`）与 Account 相关权限
3. `npm run setup:db` 会自动创建 `notes`、`github_events`、`reports`、`shares` 四张表与索引
4. 在 Auth → Providers 启用 GitHub，把 Appwrite 给出的 Redirect URI 填到 GitHub OAuth App 的回调地址
5. 在 Connect → Apps（旧版叫 Platforms）添加 Web 平台，Hostname 填 `localhost`（上线后换成正式域名）

## 常用命令

```bash
npm run dev        # 本地开发
npm run build      # 生产构建
npm run start      # 启动生产服务
npm run lint       # ESLint
npm run setup:db   # 初始化 / 同步 Appwrite 表结构（幂等）
```

## 目录结构

```
src/
  app/
    page.tsx                # 落地页
    demo/                   # 免登录体验
    dashboard/              # 工作台、Server Actions、数据加载
    api/generate/           # 周报生成接口（LLM + 模板兜底）
    api/auth/github/        # GitHub OAuth 入口与回调
    r/[slug]/               # 公开分享页
    reports/[id]/           # 历史周报详情
  lib/
    appwrite.ts             # Appwrite 客户端
    auth.ts                 # 会话与用户信息
    store.ts                # 数据读写与归属校验
    github.ts               # GitHub 公开动态采集
    report.ts               # 模板兜底生成
scripts/appwrite-setup.mjs  # 表结构初始化脚本
```

## 安全说明

- 所有密钥只存在于服务端环境变量，`.env.local` 已被 `.gitignore` 忽略
- 数据读写全部经服务端完成，按 `userId` 校验归属，越权读、删、分享均会被拒绝
- 分享页只暴露创建时的内容快照，不暴露账号信息
- 仅申请 GitHub 的 `read:user` 权限，不读写你的仓库

## 状态

比赛开发中。已完成：三视角生成、GitHub 登录与动态同步、编辑与分享、历史周报。待办：公网部署、参赛帖与演示材料。
