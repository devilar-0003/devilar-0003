import { Fragment, type ReactNode } from "react";

/** Renders `{{answer}}` cloze markup; blanks collapse to a line when hidden. */
export function ClozeText({
  text,
  revealed,
  className = "",
}: {
  text: string;
  revealed: boolean;
  className?: string;
}): ReactNode {
  const parts = text.split(/(\{\{[\s\S]*?\}\})/g);
  return (
    <span className={className}>
      {parts.map((part, i) => {
        const match = part.match(/^\{\{([\s\S]*?)\}\}$/);
        if (!match) return <Fragment key={i}>{part}</Fragment>;
        const answer = match[1];
        if (revealed) {
          return (
            <mark key={i} className="rounded bg-acid/20 px-1.5 py-0.5 font-semibold text-acid">
              {answer}
            </mark>
          );
        }
        return (
          <span
            key={i}
            aria-label="hidden term"
            className="mx-1 inline-block min-w-20 rounded-md border-b-2 border-dashed border-acid/70 align-baseline"
          >
            &nbsp;
          </span>
        );
      })}
    </span>
  );
}

export function stripCloze(text: string): string {
  return text.replace(/\{\{([\s\S]*?)\}\}/g, "$1");
}

export const KIND_LABEL: Record<string, string> = {
  qa: "Q&A",
  cloze: "Cloze",
  image: "Image",
};
