"use client";

import dynamic from "next/dynamic";
import type { ComponentProps } from "react";
import type { ArticleEditor } from "./article-editor";

const ArticleEditorClient = dynamic(
  () => import("./article-editor").then((m) => ({ default: m.ArticleEditor })),
  {
    ssr: false,
    loading: () => (
      <div className="grid animate-pulse gap-6 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <div className="h-64 rounded-lg border bg-muted" />
        </div>
        <div className="h-48 rounded-lg border bg-muted" />
      </div>
    ),
  },
);

export function ArticleEditorWrapper(
  props: ComponentProps<typeof ArticleEditor>,
) {
  return <ArticleEditorClient {...props} />;
}
