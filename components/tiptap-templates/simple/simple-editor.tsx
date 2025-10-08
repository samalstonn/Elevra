"use client"

import * as React from "react"
import { EditorContent, EditorContext, useEditor } from "@tiptap/react"

// --- Tiptap Core Extensions ---
import { StarterKit } from "@tiptap/starter-kit"
import { Image } from "@tiptap/extension-image"
import { TaskItem, TaskList } from "@tiptap/extension-list"
import { TextAlign } from "@tiptap/extension-text-align"
import { Typography } from "@tiptap/extension-typography"
import { Highlight } from "@tiptap/extension-highlight"
import { Subscript } from "@tiptap/extension-subscript"
import { Superscript } from "@tiptap/extension-superscript"
import { Selection } from "@tiptap/extensions"

// --- UI Primitives ---
import { Button } from "@/components/tiptap-ui-primitive/button"
import { Spacer } from "@/components/tiptap-ui-primitive/spacer"
import {
  Toolbar,
  ToolbarGroup,
  ToolbarSeparator,
} from "@/components/tiptap-ui-primitive/toolbar"

// --- Tiptap Node ---
import { ImageUploadNode } from "@/components/tiptap-node/image-upload-node/image-upload-node-extension"
import { HorizontalRule } from "@/components/tiptap-node/horizontal-rule-node/horizontal-rule-node-extension"
import { VideoNode } from "@/components/tiptap-node/video-node/video-node-extension"
import "@/components/tiptap-node/blockquote-node/blockquote-node.scss"
import "@/components/tiptap-node/code-block-node/code-block-node.scss"
import "@/components/tiptap-node/horizontal-rule-node/horizontal-rule-node.scss"
import "@/components/tiptap-node/list-node/list-node.scss"
import "@/components/tiptap-node/image-node/image-node.scss"
import "@/components/tiptap-node/heading-node/heading-node.scss"
import "@/components/tiptap-node/paragraph-node/paragraph-node.scss"

// --- Tiptap UI ---
import { HeadingDropdownMenu } from "@/components/tiptap-ui/heading-dropdown-menu"
import { ImageUploadButton } from "@/components/tiptap-ui/image-upload-button"
import { ListDropdownMenu } from "@/components/tiptap-ui/list-dropdown-menu"
import { BlockquoteButton } from "@/components/tiptap-ui/blockquote-button"
import {
  ColorHighlightPopover,
  ColorHighlightPopoverContent,
  ColorHighlightPopoverButton,
} from "@/components/tiptap-ui/color-highlight-popover"
import {
  LinkPopover,
  LinkContent,
  LinkButton,
} from "@/components/tiptap-ui/link-popover"
import { MarkButton } from "@/components/tiptap-ui/mark-button"
import { TextAlignButton } from "@/components/tiptap-ui/text-align-button"
import { UndoRedoButton } from "@/components/tiptap-ui/undo-redo-button"

// --- Icons ---
import { ArrowLeftIcon } from "@/components/tiptap-icons/arrow-left-icon"
import { HighlighterIcon } from "@/components/tiptap-icons/highlighter-icon"
import { LinkIcon } from "@/components/tiptap-icons/link-icon"

// --- Hooks ---
import { useIsMobile } from "@/hooks/use-mobile"
import { useWindowSize } from "@/hooks/use-window-size"
import { useCursorVisibility } from "@/hooks/use-cursor-visibility"

// --- Components ---
/* import { ThemeToggle } from "@/components/tiptap-templates/simple/theme-toggle" */

// --- Lib ---
import { MAX_FILE_SIZE } from "@/lib/tiptap-utils"

// --- Styles ---
import "@/components/tiptap-templates/simple/simple-editor.scss"

import content from "@/components/tiptap-templates/simple/data/content.json"
import { Button as AppButton } from "@/components/ui/button"
import Link from "next/link"

const MainToolbarContent = ({
  onHighlighterClick,
  onLinkClick,
  onVideoClick,
  isMobile,
}: {
  onHighlighterClick: () => void
  onLinkClick: () => void
  onVideoClick: () => void
  isMobile: boolean
}) => {
  return (
    <>
      <Spacer />

      <ToolbarGroup>
        <UndoRedoButton action="undo" />
        <UndoRedoButton action="redo" />
      </ToolbarGroup>

      <ToolbarSeparator />

      <ToolbarGroup>
        <HeadingDropdownMenu levels={[1, 2, 3, 4]} portal={isMobile} />
        <ListDropdownMenu
          types={["bulletList", "orderedList", "taskList"]}
          portal={isMobile}
        />
        <BlockquoteButton />
      </ToolbarGroup>

      <ToolbarSeparator />

      <ToolbarGroup>
        <MarkButton type="bold" />
        <MarkButton type="italic" />
        <MarkButton type="strike" />
        <MarkButton type="underline" />
        {!isMobile ? (
          <ColorHighlightPopover />
        ) : (
          <ColorHighlightPopoverButton onClick={onHighlighterClick} />
        )}
        {!isMobile ? <LinkPopover /> : <LinkButton onClick={onLinkClick} />}
      </ToolbarGroup>

      <ToolbarSeparator />

      <ToolbarGroup>
        <MarkButton type="superscript" />
        <MarkButton type="subscript" />
      </ToolbarGroup>

      <ToolbarSeparator />

      <ToolbarGroup>
        <TextAlignButton align="left" />
        <TextAlignButton align="center" />
        <TextAlignButton align="right" />
        <TextAlignButton align="justify" />
      </ToolbarGroup>

      <ToolbarSeparator />

      <ToolbarGroup>
        <ImageUploadButton />
        <Button onClick={onVideoClick}>Add Video</Button>
      </ToolbarGroup>

      <Spacer />

      {isMobile && <ToolbarSeparator />}

      {/* can add theme toggle but will have to fix other buttons first */}
      {/* <ToolbarGroup>
        <ThemeToggle />
      </ToolbarGroup> */}
    </>
  )
}

const MobileToolbarContent = ({
  type,
  onBack,
}: {
  type: "highlighter" | "link"
  onBack: () => void
}) => (
  <>
    <ToolbarGroup>
      <Button data-style="ghost" onClick={onBack}>
        <ArrowLeftIcon className="tiptap-button-icon" />
        {type === "highlighter" ? (
          <HighlighterIcon className="tiptap-button-icon" />
        ) : (
          <LinkIcon className="tiptap-button-icon" />
        )}
      </Button>
    </ToolbarGroup>

    <ToolbarSeparator />

    {type === "highlighter" ? (
      <ColorHighlightPopoverContent />
    ) : (
      <LinkContent />
    )}
  </>
)

type SimpleEditorProps = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  initialContent?: any
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onSave?: (payload: { json: any; html: string }) => Promise<void> | void
  candidateSlug?: string
}

export function SimpleEditor({ initialContent, onSave, candidateSlug }: SimpleEditorProps) {
  const isMobile = useIsMobile()
  const { height } = useWindowSize()
  const [mobileView, setMobileView] = React.useState<
    "main" | "highlighter" | "link"
  >("main")
  const toolbarRef = React.useRef<HTMLDivElement>(null)
  const videoInputRef = React.useRef<HTMLInputElement | null>(null)

  const editor = useEditor({
    immediatelyRender: false,
    shouldRerenderOnTransaction: false,
    editorProps: {
      attributes: {
        autocomplete: "off",
        autocorrect: "off",
        autocapitalize: "off",
        "aria-label": "Main content area, start typing to enter text.",
        class: "simple-editor",
      },
    },
    extensions: [
      StarterKit.configure({
        horizontalRule: false,
        link: {
          openOnClick: false,
          enableClickSelection: true,
        },
      }),
      HorizontalRule,
      VideoNode,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      TaskList,
      TaskItem.configure({ nested: true }),
      Highlight.configure({ multicolor: true }),
      Image,
      Typography,
      Superscript,
      Subscript,
      Selection,
      ImageUploadNode.configure({
        accept: "image/*",
        maxSize: MAX_FILE_SIZE,
        limit: 3,
        upload: async (file, onProgress, abortSignal) => {
          if (!candidateSlug) {
            throw new Error("candidateSlug is required for uploads")
          }
          const form = new FormData()
          form.append("file", file)
          form.append("candidateSlug", candidateSlug)

          const xhr = new XMLHttpRequest()
          const promise = new Promise<string>((resolve, reject) => {
            xhr.open("PUT", "/api/blob/signed-url")
            xhr.upload.onprogress = (event) => {
              if (event.lengthComputable) {
                const pct = Math.round((event.loaded / event.total) * 100)
                onProgress?.({ progress: pct })
              }
            }
            xhr.onload = () => {
              if (xhr.status >= 200 && xhr.status < 300) {
                try {
                  const data = JSON.parse(xhr.responseText)
                  if (data?.url) resolve(data.url)
                  else reject(new Error("Invalid upload response"))
                } catch (e) {
                  reject(e as Error)
                }
              } else {
                reject(new Error(`Upload failed (${xhr.status})`))
              }
            }
            xhr.onerror = () => reject(new Error("Network error"))
            xhr.send(form)
          })

          if (abortSignal) {
            abortSignal.addEventListener("abort", () => xhr.abort())
          }

          return promise
        },
        onError: (error) => console.error("Upload failed:", error),
      }),
    ],
    content: initialContent ?? content,
  })

  // If initialContent changes after the editor is created (e.g., loaded from API), update content
  React.useEffect(() => {
    if (editor && initialContent) {
      try {
        editor.commands.setContent(initialContent)
      } catch (e) {
        console.error("Failed to set editor content", e)
      }
    }
  }, [editor, initialContent])

  const [isSaving, setIsSaving] = React.useState(false)
  const handleSave = async () => {
    if (!editor || !onSave) return
    setIsSaving(true)
    try {
      const json = editor.getJSON()
      const html = editor.getHTML()
      await onSave({ json, html })
    } finally {
      setIsSaving(false)
    }
  }

  const rect = useCursorVisibility({
    editor,
    overlayHeight: toolbarRef.current?.getBoundingClientRect().height ?? 0,
  })

  React.useEffect(() => {
    if (!isMobile && mobileView !== "main") {
      setMobileView("main")
    }
  }, [isMobile, mobileView])

  return (
    <div className="simple-editor-wrapper">
      {(onSave || candidateSlug) && (
          <div className="mb-4 flex flex-row items-center justify-end gap-2">
            {onSave && (
              <AppButton onClick={handleSave} disabled={isSaving}>
                {isSaving ? "Saving..." : "Save"}
              </AppButton>
            )}
            {candidateSlug && (
              <AppButton variant="purple" asChild>
                <Link href={`/candidate/${candidateSlug}`}>View Public Profile</Link>
              </AppButton>
            )}
          </div>
        )}
      <EditorContext.Provider value={{ editor }}>
        <Toolbar
          ref={toolbarRef}
          style={{
            ...(isMobile
              ? {
                  bottom: `calc(100% - ${height - rect.y}px)`,
                }
              : {}),
          }}
        >
          {mobileView === "main" ? (
            <MainToolbarContent
              onHighlighterClick={() => setMobileView("highlighter")}
              onLinkClick={() => setMobileView("link")}
              onVideoClick={() => videoInputRef.current?.click()}
              isMobile={isMobile}
            />
          ) : (
            <MobileToolbarContent
              type={mobileView === "highlighter" ? "highlighter" : "link"}
              onBack={() => setMobileView("main")}
            />
          )}
        </Toolbar>

        <EditorContent
          editor={editor}
          role="presentation"
          className="simple-editor-content"
        />

        {/* Hidden input for video uploads */}
        <input
          ref={videoInputRef}
          type="file"
          accept="video/*"
          className="hidden"
          onChange={async (e) => {
            const file = e.target.files?.[0]
            if (!file) return
            if (!candidateSlug) {
              console.error("candidateSlug is required for uploads")
              return
            }
            try {
              const form = new FormData()
              form.append("file", file)
              form.append("candidateSlug", candidateSlug)
              const res = await fetch("/api/blob/signed-url", {
                method: "PUT",
                body: form,
              })
              if (!res.ok) throw new Error(`Upload failed (${res.status})`)
              const data = await res.json()
              const url: string | undefined = data?.url
              if (!url) throw new Error("Invalid upload response")
              editor?.chain().focus().setVideo({ src: url }).run()
            } catch (err) {
              console.error("Video upload failed:", err)
            } finally {
              e.currentTarget.value = ""
            }
          }}
        />
      </EditorContext.Provider>
    </div>
  )
}
