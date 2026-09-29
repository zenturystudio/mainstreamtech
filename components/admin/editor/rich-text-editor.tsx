"use client"

import { useRef, useState } from "react"
import { EditorContent, useEditor, useEditorState, type Editor } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import Image from "@tiptap/extension-image"
import Placeholder from "@tiptap/extension-placeholder"
import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight"
import { common, createLowlight } from "lowlight"
import { toast } from "sonner"
import {
  Bold,
  Code,
  Heading2,
  Heading3,
  ImagePlus,
  Italic,
  Link2,
  List,
  ListOrdered,
  Loader2,
  Minus,
  Pilcrow,
  Quote,
  Redo2,
  SquareCode,
  Strikethrough,
  Underline,
  Undo2,
  Unlink,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { uploadImage } from "@/lib/storage"
import { cn } from "@/lib/utils"

const lowlight = createLowlight(common)

export function RichTextEditor({ value, onChange }: { value: string; onChange: (html: string) => void }) {
  const editor = useEditor({
    // Rendered on the client only; avoids hydration mismatches.
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3, 4] },
        codeBlock: false,
        link: { openOnClick: false, autolink: true, defaultProtocol: "https", HTMLAttributes: { rel: "noopener noreferrer" } },
      }),
      CodeBlockLowlight.configure({ lowlight, defaultLanguage: "plaintext" }),
      Image.configure({ HTMLAttributes: { loading: "lazy" } }),
      Placeholder.configure({ placeholder: "Start writing your story…" }),
    ],
    content: value,
    editorProps: {
      attributes: {
        class:
          "prose prose-neutral dark:prose-invert max-w-none min-h-[480px] px-6 py-5 focus:outline-none prose-headings:font-bold prose-a:text-brand prose-img:rounded-xl prose-blockquote:border-l-brand",
        "aria-label": "Post content",
      },
    },
    onUpdate: ({ editor }) => onChange(editor.isEmpty ? "" : editor.getHTML()),
  })

  return (
    <div className="overflow-hidden rounded-2xl border bg-background focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/20">
      {editor ? <Toolbar editor={editor} /> : <div className="h-[49px] border-b" />}
      <EditorContent editor={editor} />
    </div>
  )
}

function Toolbar({ editor }: { editor: Editor }) {
  const state = useEditorState({
    editor,
    selector: ({ editor: e }) => ({
      paragraph: e.isActive("paragraph"),
      h2: e.isActive("heading", { level: 2 }),
      h3: e.isActive("heading", { level: 3 }),
      bold: e.isActive("bold"),
      italic: e.isActive("italic"),
      underline: e.isActive("underline"),
      strike: e.isActive("strike"),
      code: e.isActive("code"),
      bulletList: e.isActive("bulletList"),
      orderedList: e.isActive("orderedList"),
      blockquote: e.isActive("blockquote"),
      codeBlock: e.isActive("codeBlock"),
      link: e.isActive("link"),
      canUndo: e.can().undo(),
      canRedo: e.can().redo(),
    }),
  })

  const chain = () => editor.chain().focus()

  return (
    <div role="toolbar" aria-label="Formatting" className="sticky top-16 z-10 flex flex-wrap items-center gap-0.5 border-b bg-background/95 px-2 py-1.5 backdrop-blur">
      <Tool label="Paragraph" active={state.paragraph} onClick={() => chain().setParagraph().run()} icon={Pilcrow} />
      <Tool label="Heading 2" active={state.h2} onClick={() => chain().toggleHeading({ level: 2 }).run()} icon={Heading2} />
      <Tool label="Heading 3" active={state.h3} onClick={() => chain().toggleHeading({ level: 3 }).run()} icon={Heading3} />
      <Divider />
      <Tool label="Bold (Ctrl+B)" active={state.bold} onClick={() => chain().toggleBold().run()} icon={Bold} />
      <Tool label="Italic (Ctrl+I)" active={state.italic} onClick={() => chain().toggleItalic().run()} icon={Italic} />
      <Tool label="Underline (Ctrl+U)" active={state.underline} onClick={() => chain().toggleUnderline().run()} icon={Underline} />
      <Tool label="Strikethrough" active={state.strike} onClick={() => chain().toggleStrike().run()} icon={Strikethrough} />
      <Tool label="Inline code" active={state.code} onClick={() => chain().toggleCode().run()} icon={Code} />
      <Divider />
      <Tool label="Bulleted list" active={state.bulletList} onClick={() => chain().toggleBulletList().run()} icon={List} />
      <Tool label="Numbered list" active={state.orderedList} onClick={() => chain().toggleOrderedList().run()} icon={ListOrdered} />
      <Tool label="Quote" active={state.blockquote} onClick={() => chain().toggleBlockquote().run()} icon={Quote} />
      <Tool label="Code block" active={state.codeBlock} onClick={() => chain().toggleCodeBlock().run()} icon={SquareCode} />
      <Divider />
      <LinkTool editor={editor} active={state.link} />
      <ImageTool editor={editor} />
      <Tool label="Divider" onClick={() => chain().setHorizontalRule().run()} icon={Minus} />
      <div className="ml-auto flex items-center gap-0.5">
        <Tool label="Undo (Ctrl+Z)" disabled={!state.canUndo} onClick={() => chain().undo().run()} icon={Undo2} />
        <Tool label="Redo (Ctrl+Shift+Z)" disabled={!state.canRedo} onClick={() => chain().redo().run()} icon={Redo2} />
      </div>
    </div>
  )
}

type ToolProps = { label: string; icon: React.ComponentType<{ className?: string }>; onClick?: () => void; active?: boolean; disabled?: boolean }

function Tool({ label, icon: Icon, onClick, active, disabled }: ToolProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label={label}
          aria-pressed={active}
          disabled={disabled}
          onClick={onClick}
          className={cn(active && "bg-brand/10 text-brand hover:bg-brand/15 hover:text-brand")}
        >
          <Icon className="size-4" />
        </Button>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  )
}

const Divider = () => <span aria-hidden className="mx-1 h-5 w-px bg-border" />

function LinkTool({ editor, active }: { editor: Editor; active: boolean }) {
  const [open, setOpen] = useState(false)
  const [url, setUrl] = useState("")

  function apply() {
    const href = url.trim()
    if (!href) {
      editor.chain().focus().extendMarkRange("link").unsetLink().run()
    } else {
      const safe = /^(https?:|mailto:|\/|#)/i.test(href) ? href : `https://${href}`
      editor.chain().focus().extendMarkRange("link").setLink({ href: safe }).run()
    }
    setOpen(false)
  }

  return (
    <Popover
      open={open}
      onOpenChange={(o) => {
        if (o) setUrl((editor.getAttributes("link").href as string | undefined) ?? "")
        setOpen(o)
      }}
    >
      <PopoverTrigger asChild>
        <Button type="button" variant="ghost" size="icon-sm" aria-label="Link" aria-pressed={active} className={cn(active && "bg-brand/10 text-brand")}>
          <Link2 className="size-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="start">
        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault()
            apply()
          }}
        >
          <Input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://example.com" aria-label="Link URL" autoFocus className="h-8" />
          <Button type="submit" size="sm">
            {active ? "Update" : "Add"}
          </Button>
          {active && (
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label="Remove link"
              onClick={() => {
                editor.chain().focus().extendMarkRange("link").unsetLink().run()
                setOpen(false)
              }}
            >
              <Unlink />
            </Button>
          )}
        </form>
      </PopoverContent>
    </Popover>
  )
}

function ImageTool({ editor }: { editor: Editor }) {
  const input = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)

  async function handle(file: File | undefined) {
    if (!file) return
    setBusy(true)
    try {
      const { url } = await uploadImage(file)
      const alt = window.prompt("Describe the image for screen readers (alt text):", "") ?? ""
      editor.chain().focus().setImage({ src: url, alt }).run()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Upload failed")
    } finally {
      setBusy(false)
      if (input.current) input.current.value = ""
    }
  }

  return (
    <>
      <input ref={input} type="file" accept="image/*" className="sr-only" tabIndex={-1} onChange={(e) => handle(e.target.files?.[0])} />
      <Tool label={busy ? "Uploading…" : "Insert image"} icon={busy ? Loader2 : ImagePlus} disabled={busy} onClick={() => input.current?.click()} />
    </>
  )
}
