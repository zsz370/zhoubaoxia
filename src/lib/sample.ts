import type { GithubEvent, NoteItem } from "./types";

export const sampleNotes: NoteItem[] = [
  {
    id: "n1",
    content: "把支付回调重构成幂等处理，顺手补了 3 个单元测试",
    date: "11/10",
  },
  {
    id: "n2",
    content: "和设计对齐导出功能的空状态，确认周五前给到终稿",
    date: "11/10",
  },
  {
    id: "n3",
    content: "退款联调卡在沙箱环境，后端说本周内解决",
    date: "11/09",
  },
  {
    id: "n4",
    content: "梳理上周线上告警，发现 2 个超时问题都来自同一段重试逻辑",
    date: "11/09",
  },
];

export const sampleEvents: GithubEvent[] = [
  {
    id: "e1",
    type: "pr",
    title: "订单导出（试点客户）",
    repo: "acme/admin",
    ref: "#128",
    date: "11/10",
  },
  {
    id: "e2",
    type: "commit",
    title: "支付回调幂等处理",
    repo: "acme/pay-service",
    ref: "3f2a1c",
    date: "11/10",
  },
  {
    id: "e3",
    type: "issue",
    title: "重试逻辑超时保护",
    repo: "acme/pay-service",
    ref: "#86",
    date: "11/09",
  },
];

export const demoReport = `## 本周结果

- 提交评审「订单导出（试点客户）」〔PR #128 · acme/admin〕
- 提交「支付回调幂等处理」，并补充 3 个单元测试〔commit 3f2a1c · acme/pay-service〕
- 与设计对齐导出功能空状态，确认周五前给到终稿〔记录 11/10〕
- 梳理上周线上告警，定位 2 个超时问题来自同一段重试逻辑〔记录 11/09〕

## 关键数据

- 本周 1 次提交、1 个 PR、1 条 Issue
- 记录 4 条工作痕迹

## 风险与求助

- 退款联调卡在沙箱环境，后端预计本周内解决〔记录 11/09〕

## 下周计划

- 完成「订单导出（试点客户）」的后续验证与上线检查
- 跟进退款沙箱环境，完成退款流程联调
`;
