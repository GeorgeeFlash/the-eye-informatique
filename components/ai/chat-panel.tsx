"use client"

import { useState } from "react"
import { useChat } from "@ai-sdk/react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"

export function ChatPanel() {
  const [input, setInput] = useState("")
  const { messages, sendMessage, status } = useChat()

  const isLoading = status === "streaming" || status === "submitted"

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!input.trim()) return
    sendMessage({ role: "user", parts: [{ type: "text", text: input }] })
    setInput("")
  }

  return (
    <div className="flex h-125 flex-col rounded-lg border">
      <div className="border-b p-4">
        <h3 className="font-semibold">Assistant TEI</h3>
        <p className="text-xs text-muted-foreground">Posez vos questions sur nos produits</p>
      </div>
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
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
                  .map((p, i) => <span key={i}>{p.text}</span>)}
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
          placeholder="Votre message..."
          disabled={isLoading}
        />
        <Button type="submit" disabled={isLoading || !input.trim()}>
          Envoyer
        </Button>
      </form>
    </div>
  )
}
