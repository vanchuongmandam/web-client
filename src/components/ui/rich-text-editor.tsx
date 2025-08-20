// src/components/ui/rich-text-editor.tsx
"use client";

import { useEditor, EditorContent, Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Bold, Italic, Strikethrough, List, ListOrdered, Heading2, Heading3, Pilcrow, CaseSensitive } from 'lucide-react';
import { Button } from './button';
import { Skeleton } from './skeleton';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from './dropdown-menu';
import LineHeight, { LINE_HEIGHTS } from '@/lib/tiptap-extensions/line-height';
import FontSize, { FONT_SIZES } from '@/lib/tiptap-extensions/font-size';
import { TextStyle } from '@tiptap/extension-text-style'; // Cần extension này

const Toolbar = ({ editor }: { editor: Editor | null }) => {
  if (!editor) {
    return null;
  }

  const currentLineHeight = editor.getAttributes('paragraph').lineHeight || editor.getAttributes('heading').lineHeight || '1.75';
  const currentFontSize = editor.getAttributes('textStyle').fontSize || '18px';

  return (
    <div className="border border-input bg-transparent rounded-t-md p-1 flex items-center gap-1 flex-wrap">
      <Button type="button" onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} variant={editor.isActive('heading', { level: 2 }) ? 'secondary' : 'ghost'} size="sm"><Heading2 className="h-4 w-4" /></Button>
      <Button type="button" onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} variant={editor.isActive('heading', { level: 3 }) ? 'secondary' : 'ghost'} size="sm"><Heading3 className="h-4 w-4" /></Button>
      <Button type="button" onClick={() => editor.chain().focus().toggleBold().run()} variant={editor.isActive('bold') ? 'secondary' : 'ghost'} size="sm"><Bold className="h-4 w-4" /></Button>
      <Button type="button" onClick={() => editor.chain().focus().toggleItalic().run()} variant={editor.isActive('italic') ? 'secondary' : 'ghost'} size="sm"><Italic className="h-4 w-4" /></Button>
      <Button type="button" onClick={() => editor.chain().focus().toggleStrike().run()} variant={editor.isActive('strike') ? 'secondary' : 'ghost'} size="sm"><Strikethrough className="h-4 w-4" /></Button>
      <Button type="button" onClick={() => editor.chain().focus().toggleBulletList().run()} variant={editor.isActive('bulletList') ? 'secondary' : 'ghost'} size="sm"><List className="h-4 w-4" /></Button>
      <Button type="button" onClick={() => editor.chain().focus().toggleOrderedList().run()} variant={editor.isActive('orderedList') ? 'secondary' : 'ghost'} size="sm"><ListOrdered className="h-4 w-4" /></Button>
      
      {/* Nút Cỡ Chữ */}
       <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button type="button" variant="ghost" size="sm" className="w-24">
            <CaseSensitive className="h-4 w-4 mr-2" />
            {currentFontSize}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          {FONT_SIZES.map(fs => (
            <DropdownMenuItem 
              key={fs} 
              onClick={() => editor.chain().focus().setFontSize(fs).run()}
              className={currentFontSize === fs ? 'is-active' : ''}
            >
              {fs}
            </DropdownMenuItem>
          ))}
           <DropdownMenuItem onClick={() => editor.chain().focus().unsetFontSize().run()}>
            Mặc định
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Nút Giãn Dòng */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button type="button" variant="ghost" size="sm" className="w-24">
            <Pilcrow className="h-4 w-4 mr-2" />
            {currentLineHeight}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          {LINE_HEIGHTS.map(lh => (
            <DropdownMenuItem 
              key={lh} 
              onClick={() => editor.chain().focus().setLineHeight(lh).run()}
              className={currentLineHeight === lh ? 'is-active' : ''}
            >
              {lh}
            </DropdownMenuItem>
          ))}
          <DropdownMenuItem onClick={() => editor.chain().focus().unsetLineHeight().run()}>
            Mặc định
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export default function RichTextEditor({ value, onChange, placeholder }: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        orderedList: { HTMLAttributes: { class: 'list-decimal pl-4' } },
        bulletList: { HTMLAttributes: { class: 'list-disc pl-4' } },
      }),
      LineHeight,
      TextStyle, // Cần extension này
      FontSize,  // Thêm extension cỡ chữ
    ],
    content: value,
    immediatelyRender: false, 
    editorProps: {
      attributes: {
        class: 'prose dark:prose-invert min-h-[250px] w-full rounded-b-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
      },
    },
    onUpdate({ editor }) {
      onChange(editor.getHTML());
    },
  });

  if (!editor) {
    return <Skeleton className="h-[300px] w-full rounded-md" />;
  }

  return (
    <div className="flex flex-col">
      <Toolbar editor={editor} />
      <EditorContent editor={editor} placeholder={placeholder} />
    </div>
  );
}
