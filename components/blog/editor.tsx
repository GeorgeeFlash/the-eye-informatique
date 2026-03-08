// BlockNote editor wrapper — dynamic import prevents SSR issues
"use client"

// TODO: Install @blocknote/react and @blocknote/mantine or @blocknote/shadcn
// then replace this stub with the real editor
interface EditorProps {
  initialContent?: unknown
  onChange?: (content: unknown) => void
}

export function Editor({ onChange }: EditorProps) {
  return (
    <div className="min-h-100 rounded-md border p-4">
      {/* TODO: <BlockNoteView editor={...} /> */}
      <textarea
        className="h-full w-full resize-none outline-none"
        placeholder="Commencez à écrire..."
        onChange={(e) => onChange?.(e.target.value)}
      />
    </div>
  )
}
