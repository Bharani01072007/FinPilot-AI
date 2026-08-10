import React from "react";

export function FormattedInlineText({ text }: { text: string }) {
  if (!text) return null;
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
  return (
    <>
      {parts.map((part, i) => {
        if (part.startsWith("**") && part.endsWith("**") && part.length > 4) {
          return (
            <strong key={i} className="font-semibold text-foreground">
              {part.slice(2, -2)}
            </strong>
          );
        }
        if (part.startsWith("`") && part.endsWith("`") && part.length > 2) {
          return (
            <code key={i} className="rounded bg-muted/80 px-1.5 py-0.5 font-mono text-[11px] text-primary font-medium border border-border/50">
              {part.slice(1, -1)}
            </code>
          );
        }
        return part;
      })}
    </>
  );
}

export function RenderMarkdownText({ content }: { content: string }) {
  if (!content) return <span className="text-muted-foreground italic">Analyzing request...</span>;

  // Process markdown tables if present
  if (content.includes("|") && content.includes("---")) {
    const lines = content.split("\n");
    const tableStartIndex = lines.findIndex((l) => l.trim().startsWith("|") && l.includes("|"));
    const tableEndIndex = lines.findLastIndex((l) => l.trim().startsWith("|") && l.includes("|"));

    if (tableStartIndex !== -1 && tableEndIndex !== -1 && tableEndIndex >= tableStartIndex) {
      const beforeText = lines.slice(0, tableStartIndex).join("\n");
      const tableLines = lines.slice(tableStartIndex, tableEndIndex + 1);
      const afterText = lines.slice(tableEndIndex + 1).join("\n");

      return (
        <div className="space-y-3.5 text-xs font-sans leading-relaxed">
          {beforeText && <RenderMarkdownText content={beforeText} />}

          <div className="overflow-x-auto rounded-2xl border border-border/70 bg-card/80 p-1 shadow-soft my-3">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                {tableLines.slice(0, 1).map((row, i) => (
                  <tr key={i} className="bg-primary/10 font-semibold border-b border-border/70 text-foreground">
                    {row
                      .split("|")
                      .filter((c) => c.trim() !== "")
                      .map((cell, ci) => (
                        <th key={ci} className="p-2.5 border-r border-border/40 last:border-0 font-bold">
                          <FormattedInlineText text={cell.trim().replace(/^#+\s*/, "")} />
                        </th>
                      ))}
                  </tr>
                ))}
              </thead>
              <tbody className="divide-y divide-border/50">
                {tableLines.slice(2).map((row, i) => (
                  <tr key={i} className="hover:bg-muted/40 transition-colors">
                    {row
                      .split("|")
                      .filter((c) => c.trim() !== "")
                      .map((cell, ci) => (
                        <td key={ci} className="p-2.5 border-r border-border/30 last:border-0 text-foreground/90">
                          <FormattedInlineText text={cell.trim()} />
                        </td>
                      ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {afterText && <RenderMarkdownText content={afterText} />}
        </div>
      );
    }
  }

  // Split into paragraphs & headings
  const paragraphs = content.split("\n\n");
  return (
    <div className="space-y-2.5 text-xs font-sans leading-relaxed">
      {paragraphs.map((p, i) => {
        const trimmed = p.trim();
        if (trimmed.startsWith("### ")) {
          return (
            <h3 key={i} className="font-display text-sm font-bold text-foreground tracking-tight pt-1 flex items-center gap-1.5">
              <FormattedInlineText text={trimmed.replace(/^###\s*/, "")} />
            </h3>
          );
        }
        if (trimmed.startsWith("## ")) {
          return (
            <h2 key={i} className="font-display text-base font-bold text-foreground tracking-tight pt-1.5 border-b border-border/40 pb-1">
              <FormattedInlineText text={trimmed.replace(/^##\s*/, "")} />
            </h2>
          );
        }
        if (trimmed.startsWith("* ") || trimmed.startsWith("- ")) {
          const items = trimmed.split("\n").map((l) => l.replace(/^[*|-]\s*/, ""));
          return (
            <ul key={i} className="list-disc pl-4 space-y-1 text-foreground/90">
              {items.map((item, idx) => (
                <li key={idx}>
                  <FormattedInlineText text={item} />
                </li>
              ))}
            </ul>
          );
        }
        return (
          <p key={i} className="text-foreground/90">
            <FormattedInlineText text={trimmed} />
          </p>
        );
      })}
    </div>
  );
}
