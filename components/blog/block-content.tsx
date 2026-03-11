"use client";

import { useCreateBlockNote } from "@blocknote/react";
import { BlockNoteView } from "@blocknote/shadcn";
import type { Block } from "@blocknote/core";
import "@blocknote/shadcn/style.css";

export function BlockContent({ content }: { content: unknown }) {
  const editor = useCreateBlockNote({
    initialContent: Array.isArray(content) ? (content as Block[]) : undefined,
  });

  return <BlockNoteView editor={editor} editable={false} theme="light" />;
}
