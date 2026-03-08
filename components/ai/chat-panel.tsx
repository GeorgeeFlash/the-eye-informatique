"use client"

import { useState } from "react"
import { useChat } from "@ai-sdk/react"
import { useTranslations } from "next-intl"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { MessageCircleIcon, XIcon } from "lucide-react"

export function ChatPanel() {
  const t = useTranslations("ai")
  const [open, setOpen] = useState(false)
  const [input, setInput] = useState("")
  const { messages, sendMessage, status } = useChat()

  const isLoading = status === "streaming" || status === "submitted"

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!input.trim()) return
    sendMessage({ role: "user", parts: [{ type: "text", text: input }] })
    setInput("")
  }

  if (!open) {
    return (
      <Button
        onClick={() => setOpen(true)}
        size="icon"
        className="fixed bottom-6 right-6 z-50 size-14 rounded-full shadow-lg"
      >
        <MessageCircleIcon className="size-6" />
      </Button>
    )
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 flex h-125 w-95 flex-col rounded-lg border bg-background shadow-xl">
      <div className="flex items-center justify-between border-b p-4">
        <div>
          <h3 className="font-semibold">{t("chatTitle")}</h3>
          <p className="text-xs text-muted-foreground">{t("chatSubtitle")}</p>
        </div>
        <Button variant="ghost" size="icon" onClick={() => setOpen(false)}>
          <XIcon className="size-4" />
        </Button>
      </div>
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {messages.length === 0 && (
            <p className="text-center text-sm text-muted-foreground">
              {t("chatWelcome")}
            </p>
          )}
          {messages.map((m) => (
            <div
              key={m.id}
              className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${
                  m.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted"
                }`}
              >
                {m.parts
                  ?.filter((p) => p.type === "text")
                  .map((p, i) => (<span key={i}>{p.text}</span>))}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="rounded-lg bg-muted px-3 py-2 text-sm">...</div>
            </div>
          )}
        </div>
      </ScrollArea>
      <form onSubmit={handleSubmit} className="flex gap-2 border-t p-4">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={t("chatPlaceholder")}
          disabled={isLoading}
        />
        <Button type="submit" disabled={isLoading || !input.trim()}>
          {t("send")}
        </Button>
      </form>
    </div>
  )
}
