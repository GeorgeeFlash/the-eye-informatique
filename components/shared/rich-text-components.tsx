import type { PortableTextComponents } from "@portabletext/react";
import type { ReactNode } from "react";

type PortableTextSpan = {
  _type?: string;
  text?: string;
};

type PortableTextBlock = {
  _type?: string;
  style?: string;
  children?: PortableTextSpan[];
};

export type TocItem = {
  id: string;
  text: string;
  level: 2 | 3 | 4;
};

function textFromChildren(children: ReactNode): string {
  if (typeof children === "string" || typeof children === "number") {
    return String(children);
  }

  if (Array.isArray(children)) {
    return children.map(textFromChildren).join("");
  }

  if (children && typeof children === "object" && "props" in children) {
    const node = children as { props?: { children?: ReactNode } };
    return textFromChildren(node.props?.children ?? "");
  }

  return "";
}

export function slugifyHeading(value: string): string {
  const normalized = value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // strip diacritics
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");

  if (!normalized) {
    // Fallback for headings that are entirely non-ASCII/special characters
    const hash = Array.from(value).reduce(
      (acc, ch) => acc + ch.charCodeAt(0),
      0,
    );
    return `heading-${hash}`;
  }

  return normalized;
}

export function extractTocFromPortableText(content: unknown): TocItem[] {
  if (!Array.isArray(content)) return [];

  const items: TocItem[] = [];

  for (const block of content as PortableTextBlock[]) {
    if (block?._type !== "block") continue;

    const style = block.style ?? "normal";
    const isHeading = style === "h2" || style === "h3" || style === "h4";
    if (!isHeading) continue;

    const text = (block.children ?? [])
      .map((child) => child?.text ?? "")
      .join("")
      .trim();

    if (!text) continue;

    const level = Number(style.slice(1)) as 2 | 3 | 4;
    items.push({ id: slugifyHeading(text), text, level });
  }

  return items;
}

function Heading({
  children,
  level,
}: {
  children: ReactNode;
  level: 2 | 3 | 4;
}) {
  const text = textFromChildren(children);
  const id = slugifyHeading(text);

  if (level === 2) {
    return (
      <h2 id={id} className="scroll-mt-24 text-2xl font-bold tracking-tight">
        {children}
      </h2>
    );
  }

  if (level === 3) {
    return (
      <h3 id={id} className="scroll-mt-24 text-xl font-semibold tracking-tight">
        {children}
      </h3>
    );
  }

  return (
    <h4 id={id} className="scroll-mt-24 text-lg font-semibold tracking-tight">
      {children}
    </h4>
  );
}

export const richTextComponents: PortableTextComponents = {
  block: {
    h2: ({ children }) => <Heading level={2}>{children}</Heading>,
    h3: ({ children }) => <Heading level={3}>{children}</Heading>,
    h4: ({ children }) => <Heading level={4}>{children}</Heading>,
    blockquote: ({ children }) => (
      <blockquote className="border-l-4 border-primary/40 pl-4 italic text-muted-foreground">
        {children}
      </blockquote>
    ),
  },
  marks: {
    link: ({ children, value }) => {
      const href = typeof value?.href === "string" ? value.href : "#";
      const isExternal =
        href.startsWith("http://") || href.startsWith("https://");

      return (
        <a
          href={href}
          target={isExternal ? "_blank" : undefined}
          rel={isExternal ? "noopener noreferrer" : undefined}
          className="font-medium text-primary underline underline-offset-4 hover:text-primary/80"
        >
          {children}
        </a>
      );
    },
  },
  list: {
    bullet: ({ children }) => (
      <ul className="list-disc space-y-1 pl-6">{children}</ul>
    ),
    number: ({ children }) => (
      <ol className="list-decimal space-y-1 pl-6">{children}</ol>
    ),
  },
};
