// BlockNote editor wrapper — dynamic import prevents SSR issues
"use client";

import { useCreateBlockNote } from "@blocknote/react";
import { BlockNoteView } from "@blocknote/shadcn";
import type { Block } from "@blocknote/core";
import "@blocknote/shadcn/style.css";

interface EditorProps {
  initialContent?: unknown;
  onChange?: (content: unknown) => void;
  uploadFile?: (file: File) => Promise<string>;
}

export function Editor({ initialContent, onChange, uploadFile }: EditorProps) {
  const editor = useCreateBlockNote({
    initialContent: Array.isArray(initialContent)
      ? (initialContent as Block[])
      : undefined,
    uploadFile,
  });

  return (
    <div className="min-h-100 rounded-md border">
      <BlockNoteView
        editor={editor}
        onChange={() => {
          onChange?.(editor.document);
        }}
        theme="light"
      />
    </div>
  );
}
