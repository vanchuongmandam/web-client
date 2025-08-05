// src/components/ui/rich-text-editor.tsx
"use client";

import dynamic from 'next/dynamic';
import 'react-quill/dist/quill.snow.css'; // Import theme CSS
import { useMemo } from 'react';
import { Skeleton } from './skeleton';

// Component này sẽ đóng vai trò là trình bao bọc (wrapper)
interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export default function RichTextEditor({ value, onChange, placeholder }: RichTextEditorProps) {
  // Sử dụng dynamic import để ReactQuill chỉ được tải ở phía client
  const ReactQuill = useMemo(() => dynamic(() => import('react-quill'), { 
      ssr: false,
      loading: () => <Skeleton className="h-[250px] w-full rounded-md" />,
  }), []);

  const modules = {
    toolbar: [
      [{ 'header': [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike', 'blockquote'],
      [{'list': 'ordered'}, {'list': 'bullet'}, {'indent': '-1'}, {'indent': '+1'}],
      ['link', 'image'],
      ['clean']
    ],
  };

  return (
    <div className="bg-background">
        <ReactQuill
            theme="snow"
            value={value}
            onChange={onChange}
            modules={modules}
            placeholder={placeholder}
        />
    </div>
  );
}
