
"use client";

import { Editor } from '@tiptap/react';
import { BubbleMenu } from '@tiptap/react/menus';
import { MessageSquarePlus, Trash2 } from 'lucide-react'; // Changed StickyNote to MessageSquarePlus which is standard in lucide
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Input } from '@/components/ui/input';

interface MarginaliaBubbleMenuProps {
    editor: Editor | null;
}

export function MarginaliaBubbleMenu({ editor }: MarginaliaBubbleMenuProps) {
    const [noteText, setNoteText] = useState("");
    const [isOpen, setIsOpen] = useState(false);

    if (!editor) return null;

    const addNote = () => {
        if (noteText.trim()) {
            editor.chain().focus().setMark('highlight', { comment: noteText }).run();
            setNoteText("");
            setIsOpen(false);
        }
    };

    const removeNote = () => {
        editor.chain().focus().unsetMark('highlight').run();
    };

    const currentComment = editor.getAttributes('highlight').comment;

    return (
        <BubbleMenu editor={editor}>
            {/* If selection already has a comment, show Edit/Delete options (Simplified: Just Delete for now) */}
            {currentComment ? (
                <div className="flex items-center gap-1 bg-background border rounded-md shadow-md p-1">
                    <span className="text-xs max-w-[150px] truncate px-2 text-muted-foreground italic">
                        {currentComment}
                    </span>
                    <Button size="sm" variant="ghost" onClick={removeNote} title="Xóa ghi chú">
                        <Trash2 className="h-4 w-4" />
                    </Button>
                </div>
            ) : (
                <div className="flex items-center gap-1 bg-background border rounded-md shadow-md p-1">
                    <Popover open={isOpen} onOpenChange={setIsOpen}>
                        <PopoverTrigger asChild>
                            <Button size="sm" variant="ghost" className="h-8 gap-2">
                                <MessageSquarePlus className="h-4 w-4" />
                                <span className="text-xs">Note</span>
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-64 p-2" align="start">
                            <div className="flex gap-2">
                                <Input
                                    placeholder="Nhập ghi chú..."
                                    value={noteText}
                                    onChange={(e) => setNoteText(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && addNote()}
                                />
                                <Button size="sm" onClick={addNote}>Lưu</Button>
                            </div>
                        </PopoverContent>
                    </Popover>
                </div>
            )}
        </BubbleMenu>
    );
}
