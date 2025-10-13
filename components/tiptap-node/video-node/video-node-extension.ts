import { Node, mergeAttributes } from "@tiptap/core"

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    videoNode: {
      setVideo: (options: { src: string; title?: string; poster?: string }) => ReturnType
    }
  }
}

export const VideoNode = Node.create({
  name: "video",
  group: "block",
  atom: true,
  selectable: true,
  draggable: true,

  addAttributes() {
    return {
      src: {
        default: null,
      },
      title: {
        default: null,
      },
      poster: {
        default: null,
      },
      controls: {
        default: true,
        renderHTML: (attributes) => ({ controls: attributes.controls ? "" : undefined }),
      },
    }
  },

  parseHTML() {
    return [
      {
        tag: "video",
        getAttrs: (element) => {
          const el = element as HTMLVideoElement
          return {
            src: el.getAttribute("src"),
            title: el.getAttribute("title"),
            poster: el.getAttribute("poster"),
            controls: el.hasAttribute("controls"),
          }
        },
      },
    ]
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "video",
      mergeAttributes({
        preload: "metadata",
        class: "tt-video w-full max-w-2xl rounded",
      }, HTMLAttributes),
    ]
  },

  addCommands() {
    return {
      setVideo:
        (options) =>
        ({ chain }) =>
          chain()
            .focus()
            .insertContent({ type: this.name, attrs: options })
            .run(),
    }
  },
})

export default VideoNode

