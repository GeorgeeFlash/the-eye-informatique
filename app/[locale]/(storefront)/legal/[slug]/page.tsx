import { notFound } from "next/navigation";
import { client } from "@/sanity/lib/client";
import { sanityFetch } from "@/sanity/lib/live";
import { LEGAL_PAGE_QUERY, LEGAL_PAGES_LIST_QUERY } from "@/sanity/lib/queries";
import { PortableText } from "@portabletext/react";
import {
  extractTocFromPortableText,
  richTextComponents,
} from "@/components/shared/rich-text-components";

export async function generateStaticParams() {
  const pages = await client.fetch(LEGAL_PAGES_LIST_QUERY);
  return (pages ?? []).map((page: { slug: string }) => ({ slug: page.slug }));
}

export default async function LegalPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const { data: page } = await sanityFetch({
    query: LEGAL_PAGE_QUERY,
    params: { slug },
  });

  if (!page) notFound();

  const toc = extractTocFromPortableText(page.content);

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[1fr_280px]">
        <article className="min-w-0">
          <h1 className="mb-2 text-3xl font-bold tracking-tight">
            {page.title}
          </h1>
          {page.lastUpdated && (
            <p className="mb-8 text-sm text-muted-foreground">
              {new Date(page.lastUpdated).toLocaleDateString()}
            </p>
          )}
          <div className="prose prose-lg dark:prose-invert max-w-none">
            <PortableText
              value={page.content}
              components={richTextComponents}
            />
          </div>
        </article>

        {toc.length > 0 && (
          <aside className="hidden lg:block">
            <div className="sticky top-24 rounded-xl border bg-card p-4">
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                Table of contents
              </h2>
              <nav aria-label="Table of contents">
                <ul className="space-y-2 text-sm">
                  {toc.map((item) => (
                    <li
                      key={item.id}
                      className={item.level > 2 ? "pl-4" : undefined}
                    >
                      <a
                        href={`#${item.id}`}
                        className="text-muted-foreground transition-colors hover:text-foreground"
                      >
                        {item.text}
                      </a>
                    </li>
                  ))}
                </ul>
              </nav>
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}
