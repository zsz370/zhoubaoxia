import type { Perspective } from "./types";

export interface PerspectiveMeta {
  id: Perspective;
  label: string;
  audience: string;
  hint: string;
  sections: string;
}

export const PERSPECTIVES: PerspectiveMeta[] = [
  {
    id: "up",
    label: "向上汇报",
    audience: "给老板",
    hint: "结果先行，风险说清，要资源不绕弯。",
    sections: "本周结果 / 关键数据 / 风险与求助 / 下周计划",
  },
  {
    id: "self",
    label: "自我复盘",
    audience: "给自己",
    hint: "把经验留下来，而不是周周从零开始。",
    sections: "本周回顾 / 卡点与思考 / 有效做法 / 下周调整",
  },
  {
    id: "team",
    label: "团队协作",
    audience: "给同事",
    hint: "让别人知道该找你做什么、在等什么。",
    sections: "协作进展 / 依赖与阻塞 / 需要同步的决定 / 下周协作",
  },
];

export function perspectiveLabel(id: Perspective): string {
  return PERSPECTIVES.find((item) => item.id === id)?.label ?? "周报";
}
