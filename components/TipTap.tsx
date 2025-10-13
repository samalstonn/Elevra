'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Document from '@tiptap/extension-document'
import Paragraph from '@tiptap/extension-paragraph'
import Text from '@tiptap/extension-text'

const Tiptap = () => {
  const editor = useEditor({
    extensions: [Document, Paragraph, Text, StarterKit],
    content: '<p>Hello World! 🌎️</p>',
		autofocus: true,

    // Don't render immediately on the server to avoid SSR issues
    immediatelyRender: false,
  })

  return <EditorContent editor={editor} />
}

export default Tiptap