"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useChat } from "@ai-sdk/react";
import { useTranslations } from "next-intl";
import Markdown from "react-markdown";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ChatProductCard, type ChatProductCardProps } from "./product-card";
import { ChatLinkCard } from "./link-card";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  XIcon,
  SendIcon,
  SparklesIcon,
  Loader2Icon,
  StopCircleIcon,
  ChevronDownIcon,
  AlertCircleIcon,
} from "lucide-react";

const SUGGESTION_KEYS = [
  "irisSuggestion1",
  "irisSuggestion2",
  "irisSuggestion3",
  "irisSuggestion4",
] as const;

export function ChatPanel() {
  const t = useTranslations("ai");
  const isMobile = useIsMobile();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const { messages, sendMessage, status, stop } = useChat();
  const bottomRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const isLoading = status === "streaming" || status === "submitted";

  const scrollToBottom = useCallback((smooth = true) => {
    bottomRef.current?.scrollIntoView({
      behavior: smooth ? "smooth" : "instant",
    });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading, scrollToBottom]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const onScroll = () => {
      setShowScrollBtn(el.scrollHeight - el.scrollTop - el.clientHeight > 100);
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open]);

  function handleTextareaChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setInput(e.target.value);
    e.target.style.height = "auto";
    e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit(input);
    }
  }

  function submit(text: string) {
    const trimmed = text.trim();
    if (!trimmed || isLoading) return;
    sendMessage({ text: trimmed });
    setInput("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";
  }

  /* ── FAB ──────────────────────────────────────────────────── */
  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        aria-label={t("irisOpen")}
        className="fixed bottom-6 right-6 z-50 flex size-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-transform hover:scale-110 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <SparklesIcon className="size-6" />
      </button>
    );
  }

  /* ── Panel ────────────────────────────────────────────────── */
  return (
    <div
      className={cn(
        "fixed z-50 flex flex-col bg-background shadow-2xl animate-in fade-in-0 duration-200",
        isMobile
          ? "inset-0"
          : "bottom-6 right-6 h-[min(560px,85dvh)] w-100 rounded-2xl border slide-in-from-bottom-2",
      )}
    >
      {/* Header */}
      <div className="flex shrink-0 items-center gap-3 border-b px-4 py-3">
        <div className="relative flex size-9 shrink-0 items-center justify-center rounded-full bg-linear-to-br from-primary/70 to-primary">
          <SparklesIcon className="size-4 text-primary-foreground" />
          <span className="absolute right-0 top-0 size-2.5 rounded-full border-2 border-background bg-emerald-500" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold leading-tight">
            {t("irisTitle")}
          </p>
          <p className="truncate text-xs text-muted-foreground">
            {t("irisSubtitle")}
          </p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="shrink-0"
          onClick={() => setOpen(false)}
          aria-label={t("close")}
        >
          <XIcon className="size-4" />
        </Button>
      </div>

      {/* Messages */}
      <div
        ref={scrollRef}
        className="relative flex-1 overflow-y-auto overscroll-contain"
      >
        <div className="space-y-3 p-4">
          {/* Empty state */}
          {messages.length === 0 && (
            <div className="flex flex-col items-center gap-5 py-10 text-center">
              <div className="flex size-16 items-center justify-center rounded-full bg-primary/10">
                <SparklesIcon className="size-8 text-primary" />
              </div>
              <div className="space-y-1">
                <p className="font-semibold">{t("irisTitle")}</p>
                <p className="text-sm text-muted-foreground">
                  {t("irisWelcome")}
                </p>
              </div>
              <div className="flex flex-wrap justify-center gap-2">
                {SUGGESTION_KEYS.map((key) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => submit(t(key))}
                    className="rounded-full border bg-background px-3.5 py-1.5 text-xs font-medium transition-colors hover:bg-accent hover:text-accent-foreground active:scale-95"
                  >
                    {t(key)}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Message list */}
          {messages.map((m) => (
            <div
              key={m.id}
              className={cn(
                "flex gap-2.5 animate-in fade-in-0 slide-in-from-bottom-1 duration-150",
                m.role === "user" ? "flex-row-reverse" : "flex-row",
              )}
            >
              {/* Iris avatar */}
              {m.role === "assistant" && (
                <div className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/10">
                  <SparklesIcon className="size-3.5 text-primary" />
                </div>
              )}
              <div
                className={cn(
                  "flex min-w-0 flex-col gap-1.5",
                  m.role === "user"
                    ? "max-w-[82%] items-end"
                    : "max-w-[88%] items-start",
                )}
              >
                {m.parts.map((part, i) => {
                  switch (part.type) {
                    case "text": {
                      if (!part.text) return null;
                      return (
                        <div
                          key={i}
                          className={cn(
                            "rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed",
                            m.role === "user"
                              ? "rounded-tr-sm bg-primary text-primary-foreground"
                              : "rounded-tl-sm bg-muted",
                          )}
                        >
                          {m.role === "user" ? (
                            <span className="whitespace-pre-wrap">
                              {part.text}
                            </span>
                          ) : (
                            <Markdown
                              components={{
                                p: ({ children }) => (
                                  <p className="mb-1.5 last:mb-0">{children}</p>
                                ),
                                strong: ({ children }) => (
                                  <strong className="font-semibold">
                                    {children}
                                  </strong>
                                ),
                                em: ({ children }) => (
                                  <em className="italic">{children}</em>
                                ),
                                ul: ({ children }) => (
                                  <ul className="mb-1.5 ml-4 list-disc space-y-0.5">
                                    {children}
                                  </ul>
                                ),
                                ol: ({ children }) => (
                                  <ol className="mb-1.5 ml-4 list-decimal space-y-0.5">
                                    {children}
                                  </ol>
                                ),
                                li: ({ children }) => (
                                  <li className="leading-relaxed">
                                    {children}
                                  </li>
                                ),
                                a: ({ href, children }) => (
                                  <a
                                    href={href}
                                    className="text-primary underline"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                  >
                                    {children}
                                  </a>
                                ),
                                code: ({ children }) => (
                                  <code className="rounded bg-background/60 px-1 py-0.5 font-mono text-xs">
                                    {children}
                                  </code>
                                ),
                                h1: ({ children }) => (
                                  <p className="font-semibold">{children}</p>
                                ),
                                h2: ({ children }) => (
                                  <p className="font-semibold">{children}</p>
                                ),
                                h3: ({ children }) => (
                                  <p className="font-medium">{children}</p>
                                ),
                              }}
                            >
                              {part.text}
                            </Markdown>
                          )}
                        </div>
                      );
                    }

                    case "tool-searchProducts": {
                      if (part.state === "output-available") {
                        const products = part.output as ChatProductCardProps[];
                        if (products.length === 0) return null;
                        return (
                          <div key={i} className="w-full space-y-1.5">
                            {products.map((p) => (
                              <ChatProductCard key={p.slug} {...p} />
                            ))}
                          </div>
                        );
                      }
                      if (part.state === "output-error") {
                        return <ToolError key={i} />;
                      }
                      return (
                        <ToolLoader key={i} label={t("searchingProducts")} />
                      );
                    }

                    case "tool-getProductDetails": {
                      if (part.state === "output-available") {
                        const detail = part.output as Record<string, unknown>;
                        if ("error" in detail) return null;
                        return (
                          <div key={i} className="w-full">
                            <ChatProductCard
                              slug={detail.slug as string}
                              name={detail.name as string}
                              brand={detail.brand as string | null}
                              category={detail.category as string}
                              price={detail.basePrice as number}
                              currency={detail.currency as string}
                              imageUrl={
                                (detail.images as Array<{ url: string }>)?.[0]
                                  ?.url
                              }
                              inStock={(
                                detail.variants as Array<{ stock: number }>
                              )?.some((v) => v.stock > 0)}
                              condition={
                                (
                                  detail.variants as Array<{
                                    condition: "NEW" | "REFURBISHED";
                                  }>
                                )?.[0]?.condition ?? "NEW"
                              }
                            />
                          </div>
                        );
                      }
                      if (part.state === "output-error") {
                        return <ToolError key={i} />;
                      }
                      return <ToolLoader key={i} label={t("loadingProduct")} />;
                    }

                    case "tool-navigateTo": {
                      if (part.state === "output-available") {
                        const link = part.output as {
                          path: string;
                          label: string;
                        };
                        return (
                          <div key={i} className="w-full">
                            <ChatLinkCard
                              path={link.path}
                              label={link.label}
                              intent={
                                (part.input as { intent?: string })?.intent
                              }
                            />
                          </div>
                        );
                      }
                      return null;
                    }

                    default:
                      return null;
                  }
                })}
              </div>
            </div>
          ))}

          {/* Thinking indicator */}
          {isLoading && messages.at(-1)?.role === "user" && (
            <div className="flex items-end gap-2.5 animate-in fade-in-0 duration-200">
              <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/10">
                <SparklesIcon className="size-3.5 text-primary" />
              </div>
              <ThinkingDots />
            </div>
          )}

          {/* Auto-scroll anchor */}
          <div ref={bottomRef} />
        </div>

        {/* Scroll-to-bottom button */}
        {showScrollBtn && (
          <button
            type="button"
            onClick={() => scrollToBottom()}
            aria-label="Scroll to bottom"
            className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-1 rounded-full border bg-background px-3 py-1.5 text-xs shadow-md hover:bg-accent animate-in fade-in-0 duration-150"
          >
            <ChevronDownIcon className="size-3" />
            {t("irisScrollDown")}
          </button>
        )}
      </div>

      {/* Input area */}
      <div className="shrink-0 border-t p-3">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            submit(input);
          }}
          className="flex items-end gap-2"
        >
          <textarea
            ref={textareaRef}
            rows={1}
            value={input}
            onChange={handleTextareaChange}
            onKeyDown={handleKeyDown}
            placeholder={t("irisPlaceholder")}
            disabled={isLoading}
            className="max-h-30 flex-1 resize-none overflow-y-auto rounded-xl border bg-muted/50 px-3.5 py-2.5 text-sm outline-none transition-[border-color,box-shadow] placeholder:text-muted-foreground focus:border-primary/50 focus:ring-1 focus:ring-primary/30 disabled:opacity-50"
          />
          {isLoading ? (
            <button
              type="button"
              onClick={() => stop()}
              aria-label="Stop"
              className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-destructive text-destructive-foreground transition-opacity hover:opacity-85"
            >
              <StopCircleIcon className="size-4" />
            </button>
          ) : (
            <button
              type="submit"
              disabled={!input.trim()}
              aria-label={t("send")}
              className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-40 active:scale-95"
            >
              <SendIcon className="size-4" />
            </button>
          )}
        </form>
        <p className="mt-1.5 text-center text-[10px] text-muted-foreground/70">
          {t("irisPoweredBy")}
        </p>
      </div>
    </div>
  );
}

/* ── Animated 3-dot thinking indicator ─────────────────────────────────── */
function ThinkingDots() {
  return (
    <div className="flex items-center gap-1 rounded-2xl rounded-tl-sm bg-muted px-4 py-3.5">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="size-1.5 rounded-full bg-muted-foreground/50 animate-bounce"
          style={{ animationDelay: `${i * 160}ms`, animationDuration: "900ms" }}
        />
      ))}
    </div>
  );
}

/* ── Tool loading indicator ─────────────────────────────────────────────── */
function ToolLoader({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-2 rounded-xl border border-dashed bg-muted/40 px-3 py-2.5">
      <Loader2Icon className="size-3.5 shrink-0 animate-spin text-primary" />
      <span className="text-xs text-muted-foreground">{label}</span>
    </div>
  );
}

/* ── Tool error indicator ───────────────────────────────────────────────── */
function ToolError() {
  return (
    <div className="flex items-center gap-2 rounded-xl border border-dashed border-destructive/40 bg-destructive/5 px-3 py-2.5">
      <AlertCircleIcon className="size-3.5 shrink-0 text-destructive" />
      <span className="text-xs text-destructive/80">
        Something went wrong. Please try again.
      </span>
    </div>
  );
}
