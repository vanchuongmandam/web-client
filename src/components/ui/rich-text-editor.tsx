// src/components/ui/rich-text-editor.tsx
"use client";

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Bold, Italic, Strikethrough, List, ListOrdered, Heading2, Heading3 } from 'lucide-react';
import { Button } from './button';
import { useState, useEffect } from 'react';
import { Skeleton } from './skeleton';


// --- Toolbar (giữ nguyên) ---
const Toolbar = ({ editor }: { editor: any }) => {
  if (!editor) {
    return null;
  }
  return (
    <div className="border border-input bg-transparent rounded-t-md p-1 flex items-center gap-1">
      <Button type="button" onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} variant={editor.isActive('heading', { level: 2 }) ? 'secondary' : 'ghost'} size="sm"><Heading2 className="h-4 w-4" /></Button>
      <Button type="button" onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} variant={editor.isActive('heading', { level: 3 }) ? 'secondary' : 'ghost'} size="sm"><Heading3 className="h-4 w-4" /></Button>
      <Button type="button" onClick={() => editor.chain().focus().toggleBold().run()} variant={editor.isActive('bold') ? 'secondary' : 'ghost'} size="sm"><Bold className="h-4 w-4" /></Button>
      <Button type="button" onClick={() => editor.chain().focus().toggleItalic().run()} variant={editor.isActive('italic') ? 'secondary' : 'ghost'} size="sm"><Italic className="h-4 w-4" /></Button>
      <Button type="button" onClick={() => editor.chain().focus().toggleStrike().run()} variant={editor.isActive('strike') ? 'secondary' : 'ghost'} size="sm"><Strikethrough className="h-4 w-4" /></Button>
      <Button type="button" onClick={() => editor.chain().focus().toggleBulletList().run()} variant={editor.isActive('bulletList') ? 'secondary' : 'ghost'} size="sm"><List className="h-4 w-4" /></Button>
      <Button type="button" onClick={() => editor.chain().focus().toggleOrderedList().run()} variant={editor.isActive('orderedList') ? 'secondary' : 'ghost'} size="sm"><ListOrdered className="h-4 w-4" /></Button>
    </div>
  );
};


// --- Component Editor chính (Đã sửa) ---
interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export default function RichTextEditor({ value, onChange, placeholder }: RichTextEditorProps) {
  const [isMounted, setIsMounted] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        orderedList: { HTMLAttributes: { class: 'list-decimal pl-4' } },
        bulletList: { HTMLAttributes: { class: 'list-disc pl-4' } },
      }),
    ],
    content: value,
    editorProps: {
      attributes: {
        class: 'prose dark:prose-invert min-h-[250px] w-full rounded-b-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
      },
    },
    onUpdate({ editor }) {
      onChange(editor.getHTML());
    },
  });

  // Chỉ set isMounted thành true khi component đã ở trên client
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Cập nhật nội dung cho editor khi `value` từ form thay đổi
  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value);
    }
  }, [value, editor]);


  // Nếu chưa mount (đang ở SSR), hiển thị skeleton để tránh lỗi
  if (!isMounted) {
    return <Skeleton className="h-[300px] w-full rounded-md" />;
  }

  return (
    <div>
      <Toolbar editor={editor} />
      <EditorContent editor={editor} placeholder={placeholder} />
    </div>
  );
}
