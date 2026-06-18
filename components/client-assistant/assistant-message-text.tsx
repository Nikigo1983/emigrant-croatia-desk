import type { ReactNode } from "react";

type Props = {
  content: string;
};

function renderInline(text: string, keyPrefix: string): ReactNode[] {
  const parts: ReactNode[] = [];
  const regex = /(\*\*[^*]+\*\*|\*[^*]+\*)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null = regex.exec(text);
  let partIndex = 0;

  while (match) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }

    const token = match[0];
    if (token.startsWith("**")) {
      parts.push(
        <strong key={`${keyPrefix}-b-${partIndex}`} className="font-semibold text-slate-900">
          {token.slice(2, -2)}
        </strong>,
      );
    } else {
      parts.push(
        <em key={`${keyPrefix}-i-${partIndex}`} className="text-slate-700">
          {token.slice(1, -1)}
        </em>,
      );
    }

    lastIndex = match.index + token.length;
    partIndex += 1;
    match = regex.exec(text);
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts;
}

function renderHeading(level: 2 | 3, text: string, key: string) {
  const className =
    level === 2
      ? "text-base font-semibold text-slate-900"
      : "text-sm font-semibold text-slate-900";

  if (level === 2) {
    return (
      <h3 key={key} className={className}>
        {renderInline(text, key)}
      </h3>
    );
  }

  return (
    <h4 key={key} className={className}>
      {renderInline(text, key)}
    </h4>
  );
}

export function AssistantMessageText({ content }: Props) {
  const lines = content.split("\n");
  const blocks: ReactNode[] = [];
  let listItems: string[] = [];
  let blockIndex = 0;

  const flushList = () => {
    if (listItems.length === 0) {
      return;
    }

    blocks.push(
      <ul key={`list-${blockIndex}`} className="list-disc space-y-1 pl-5">
        {listItems.map((item, index) => (
          <li key={`${blockIndex}-${index}`}>{renderInline(item, `li-${blockIndex}-${index}`)}</li>
        ))}
      </ul>,
    );
    listItems = [];
    blockIndex += 1;
  };

  for (const line of lines) {
    const trimmed = line.trim();

    if (!trimmed) {
      flushList();
      continue;
    }

    if (trimmed.startsWith("### ")) {
      flushList();
      blocks.push(renderHeading(3, trimmed.slice(4), `h3-${blockIndex}`));
      blockIndex += 1;
      continue;
    }

    if (trimmed.startsWith("## ")) {
      flushList();
      blocks.push(renderHeading(2, trimmed.slice(3), `h2-${blockIndex}`));
      blockIndex += 1;
      continue;
    }

    if (trimmed.startsWith("- ") || trimmed.startsWith("• ")) {
      listItems.push(trimmed.slice(2));
      continue;
    }

    const numberedMatch = trimmed.match(/^\d+\.\s+(.+)$/);
    if (numberedMatch) {
      flushList();
      listItems.push(numberedMatch[1]);
      continue;
    }

    flushList();
    blocks.push(
      <p key={`p-${blockIndex}`} className="whitespace-pre-wrap">
        {renderInline(trimmed, `p-${blockIndex}`)}
      </p>,
    );
    blockIndex += 1;
  }

  flushList();

  if (blocks.length === 0) {
    return null;
  }

  return <div className="space-y-3 text-sm leading-relaxed text-slate-800">{blocks}</div>;
}
