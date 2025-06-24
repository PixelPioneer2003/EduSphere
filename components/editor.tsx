"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { useEffect } from "react";

interface EditorProps {
  onChange: (value: string) => void;
  value: string;
}

export const Editor = ({
  onChange,
  value,
}: EditorProps) => {

  const editor = useEditor({
    extensions: [StarterKit],
    content: value,
    onUpdate({ editor }) {
      onChange(editor.getHTML());
    },
  });

  // Keep editor in sync if `value` prop changes externally
  useEffect(() => {
    if (editor && editor.getHTML() !== value) {
      editor.commands.setContent(value);
    }
  }, [value, editor]);

  return (
    <div className="bg-white border rounded p-2 min-h-[150px]">
      <EditorContent editor={editor} />
    </div>
  );
};
