import type { ReactNode } from "react";

type ListBlock =
  | { kind: "ul"; items: string[] }
  | { kind: "ol"; items: string[] };

type Block =
  | { kind: "h2"; text: string }
  | { kind: "h3"; text: string }
  | { kind: "p"; text: string }
  | ListBlock;

function renderInline(text: string, key: string): ReactNode[] {
  const tokens = text.split(/(\*\*[^*]+\*\*|〔[^〕]+〕)/g).filter(Boolean);

  return tokens.map((token, index) => {
    const tokenKey = `${key}-${index}`;

    if (token.startsWith("**") && token.endsWith("**")) {
      return (
        <strong key={tokenKey} className="font-semibold text-ink">
          {token.slice(2, -2)}
        </strong>
      );
    }

    if (token.startsWith("〔") && token.endsWith("〕")) {
      return (
        <span
          key={tokenKey}
          className="mx-1 inline-flex items-center rounded-md bg-brand-soft px-1.5 py-0.5 align-[1px] font-mono text-[11px] leading-none text-brand-deep"
        >
          {token.slice(1, -1)}
        </span>
      );
    }

    return <span key={tokenKey}>{token}</span>;
  });
}

function parse(markdown: string): Block[] {
  const blocks: Block[] = [];
  let list: ListBlock | null = null;

  const flushList = () => {
    if (list) {
      blocks.push(list);
      list = null;
    }
  };

  for (const rawLine of markdown.split(/\r?\n/)) {
    const line = rawLine.trim();

    if (line === "") {
      flushList();
      continue;
    }

    const heading2 = line.match(/^##\s+(.*)$/);
    if (heading2) {
      flushList();
      blocks.push({ kind: "h2", text: heading2[1] });
      continue;
    }

    const heading3 = line.match(/^###\s+(.*)$/);
    if (heading3) {
      flushList();
      blocks.push({ kind: "h3", text: heading3[1] });
      continue;
    }

    const bullet = line.match(/^[-*]\s+(.*)$/);
    if (bullet) {
      if (!list || list.kind !== "ul") {
        flushList();
        list = { kind: "ul", items: [] };
      }
      list.items.push(bullet[1]);
      continue;
    }

    const ordered = line.match(/^\d+[.、]\s+(.*)$/);
    if (ordered) {
      if (!list || list.kind !== "ol") {
        flushList();
        list = { kind: "ol", items: [] };
      }
      list.items.push(ordered[1]);
      continue;
    }

    flushList();
    blocks.push({ kind: "p", text: line });
  }

  flushList();
  return blocks;
}

export function MarkdownView({ markdown }: { markdown: string }) {
  const blocks = parse(markdown);

  return (
    <div className="space-y-4 text-[14.5px] leading-7 text-ink-soft">
      {blocks.map((block, index) => {
        const key = `block-${index}`;

        if (block.kind === "h2") {
          return (
            <h2
              key={key}
              className="flex items-center gap-2 pt-1 text-[16px] font-semibold text-ink"
            >
              <span className="h-3.5 w-[3px] rounded-full bg-brand" />
              {block.text}
            </h2>
          );
        }

        if (block.kind === "h3") {
          return (
            <h3 key={key} className="text-[15px] font-semibold text-ink">
              {block.text}
            </h3>
          );
        }

        if (block.kind === "ul") {
          return (
            <ul key={key} className="space-y-2">
              {block.items.map((item, itemIndex) => (
                <li key={`${key}-${itemIndex}`} className="flex gap-2.5">
                  <span className="mt-[10px] size-1.5 shrink-0 rounded-full bg-brand/70" />
                  <span>
                    {renderInline(item, `${key}-${itemIndex}`)}
                  </span>
                </li>
              ))}
            </ul>
          );
        }

        if (block.kind === "ol") {
          return (
            <ol key={key} className="space-y-2">
              {block.items.map((item, itemIndex) => (
                <li key={`${key}-${itemIndex}`} className="flex gap-2.5">
                  <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-md bg-brand-soft font-mono text-[11px] text-brand-deep">
                    {itemIndex + 1}
                  </span>
                  <span>
                    {renderInline(item, `${key}-${itemIndex}`)}
                  </span>
                </li>
              ))}
            </ol>
          );
        }

        return (
          <p key={key}>{renderInline(block.text, key)}</p>
        );
      })}
    </div>
  );
}
