"use client";

import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { useEffect, useState } from "react";

interface PreviewProps {
  value: string;
}

export const Preview = ({ value }: PreviewProps) => {
  const [isMounted, setIsMounted] = useState(false);

  const editor = useEditor({
    extensions: [StarterKit],
    editable: false,
    content: value,
    immediatelyRender: false,
  });

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (editor && editor.getHTML() !== value) {
      editor.commands.setContent(value);
    }
  }, [value, editor]);

  if (!isMounted) return null;

  return (
    <div className="bg-white border rounded p-2 min-h-[100px]">
      <EditorContent editor={editor} />
    </div>
  );
};
