// src/app/articles/[slug]/comment-section.tsx
"use client";

import { useState, useEffect, FormEvent } from 'react';
import Link from 'next/link';
import type { Comment } from '@/lib/types';
import { useAuth } from '@/context/AuthContext';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';
import { Loader2, MoreHorizontal } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";


// --- Các hàm gọi API ---

async function getComments(articleId: string): Promise<Comment[]> {
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
    const response = await fetch(`${apiBaseUrl}/comments/article/${articleId}`);
    if (!response.ok) throw new Error('Failed to fetch comments');
    return response.json();
}

async function postComment(articleId: string, content: string, token: string): Promise<Comment> {
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
    const response = await fetch(`${apiBaseUrl}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}`},
        body: JSON.stringify({ articleId, content })
    });
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to post comment');
    }
    return response.json();
}

async function updateComment(commentId: string, content: string, token: string): Promise<Comment> {
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
    const response = await fetch(`${apiBaseUrl}/comments/${commentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}`},
        body: JSON.stringify({ content })
    });
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update comment');
    }
    return response.json();
}

async function deleteComment(commentId: string, token: string): Promise<void> {
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
    const response = await fetch(`${apiBaseUrl}/comments/${commentId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}`},
    });
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete comment');
    }
}


// --- Component con để hiển thị một bình luận ---
const CommentItem = ({ comment, onCommentUpdated, onCommentDeleted }: { 
    comment: Comment, 
    onCommentUpdated: (updatedComment: Comment) => void,
    onCommentDeleted: (commentId: string) => void,
}) => {
    const { user, token } = useAuth();
    const [isEditing, setIsEditing] = useState(false);
    [isSubmitting, setIsSubmitting] = useState(false);
    const [editedContent, setEditedContent] = useState(comment.content);
    const { toast } = useToast();

    const isAuthor = user && user._id === comment.author._id;

    const handleUpdate = async () => {
        if (!token || !editedContent.trim()) return;
        setIsSubmitting(true);
        try {
            const updatedComment = await updateComment(comment._id, editedContent, token);
            onCommentUpdated(updatedComment);
            setIsEditing(false);
            toast({ title: "Thành công!", description: "Bình luận đã được cập nhật." });
        } catch (error: any) {
            toast({ variant: "destructive", title: "Lỗi", description: error.message });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async () => {
        if (!token) return;
        try {
            await deleteComment(comment._id, token);
            onCommentDeleted(comment._id);
            toast({ title: "Thành công!", description: "Bình luận đã được xóa." });
        } catch (error: any) {
            toast({ variant: "destructive", title: "Lỗi", description: error.message });
        }
    };

    return (
        <div className="flex items-start space-x-4">
            <Avatar>
                <AvatarImage src={`https://api.dicebear.com/8.x/lorelei/svg?seed=${comment.author.username}`} alt={comment.author.username} />
                <AvatarFallback>{comment.author.username.charAt(0).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <p className="font-semibold">{comment.author.username}</p>
                        <p className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true, locale: vi })}
                        </p>
                    </div>
                    {isAuthor && !isEditing && (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                            <DropdownMenuContent>
                                <DropdownMenuItem onClick={() => setIsEditing(true)}>Chỉnh sửa</DropdownMenuItem>
                                <AlertDialog>
                                    <AlertDialogTrigger asChild><DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-red-500">Xóa</DropdownMenuItem></AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader><AlertDialogTitle>Bạn có chắc chắn?</AlertDialogTitle><AlertDialogDescription>Hành động này không thể được hoàn tác. Bình luận của bạn sẽ bị xóa vĩnh viễn.</AlertDialogDescription></AlertDialogHeader>
                                        <AlertDialogFooter><AlertDialogCancel>Hủy</AlertDialogCancel><AlertDialogAction onClick={handleDelete}>Xóa</AlertDialogAction></AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    )}
                </div>

                {!isEditing ? (
                    <p className="text-sm mt-1 whitespace-pre-wrap">{comment.content}</p>
                ) : (
                    <div className="space-y-2 mt-2">
                        <Textarea value={editedContent} onChange={(e) => setEditedContent(e.target.value)} rows={3} disabled={isSubmitting} />
                        <div className="flex gap-2">
                            <Button size="sm" onClick={handleUpdate} disabled={isSubmitting}>
                                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Lưu
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => setIsEditing(false)}>Hủy</Button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};


// --- Component chính ---
export default function CommentSection({ articleId }: { articleId: string }) {
    const [comments, setComments] = useState<Comment[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [newCommentContent, setNewCommentContent] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    const { user, token } = useAuth();
    const { toast } = useToast();

    useEffect(() => {
        const fetchComments = async () => {
            setIsLoading(true);
            try {
                const fetchedComments = await getComments(articleId);
                setComments(fetchedComments);
            } catch (error: any) {
                 toast({ variant: "destructive", title: "Lỗi", description: "Không thể tải được bình luận."});
            } finally {
                setIsLoading(false);
            }
        };
        if (articleId) fetchComments();
    }, [articleId, toast]);

    const handleCommentSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (!newCommentContent.trim() || !token) return;
        setIsSubmitting(true);
        try {
            const newComment = await postComment(articleId, newCommentContent, token);
            setComments(prev => [newComment, ...prev]);
            setNewCommentContent('');
            toast({ title: "Thành công!", description: "Bình luận của bạn đã được đăng." });
        } catch (error: any) {
            toast({ variant: "destructive", title: "Lỗi", description: error.message });
        } finally {
            setIsSubmitting(false);
        }
    };
    
    const handleCommentUpdated = (updatedComment: Comment) => {
        setComments(prev => prev.map(c => c._id === updatedComment._id ? updatedComment : c));
    };

    const handleCommentDeleted = (commentId: string) => {
        setComments(prev => prev.filter(c => c._id !== commentId));
    };

    return (
        <section className="mt-12">
            <h2 className="font-headline text-3xl font-bold mb-6">Thảo luận ({comments.length})</h2>
            <div className="mb-6">
                {user ? (
                    <form onSubmit={handleCommentSubmit} className="space-y-4">
                        <div className="flex items-start space-x-4">
                            <Avatar>
                                <AvatarImage src={`https://api.dicebear.com/8.x/lorelei/svg?seed=${user.username}`} alt={user.username} />
                                <AvatarFallback>{user.username.charAt(0).toUpperCase()}</AvatarFallback>
                            </Avatar>
                            <Textarea
                                placeholder="Chia sẻ suy nghĩ của bạn..."
                                value={newCommentContent}
                                onChange={(e) => setNewCommentContent(e.target.value)}
                                disabled={isSubmitting}
                                rows={3}
                            />
                        </div>
                        <div className="flex justify-end">
                            <Button type="submit" disabled={isSubmitting || !newCommentContent.trim()}>
                                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Gửi bình luận
                            </Button>
                        </div>
                    </form>
                ) : (
                    <div className="text-center p-4 border rounded-lg"><p><Link href="/login" className="font-semibold text-primary hover:underline">Đăng nhập</Link>{" "}để tham gia thảo luận.</p></div>
                )}
            </div>
            <Separator />
            <div className="space-y-6 mt-6">
                {isLoading ? (
                    Array.from({ length: 3 }).map((_, i) => (
                         <div className="flex items-start space-x-4" key={i}><Skeleton className="h-10 w-10 rounded-full" /><div className="space-y-2 flex-1"><Skeleton className="h-4 w-1/4" /><Skeleton className="h-4 w-full" /></div></div>
                    ))
                ) : comments.length > 0 ? (
                    comments.map(comment => <CommentItem key={comment._id} comment={comment} onCommentUpdated={handleCommentUpdated} onCommentDeleted={handleCommentDeleted} />)
                ) : (
                    <p className="text-muted-foreground pt-4 text-center">Chưa có bình luận nào. Hãy là người đầu tiên!</p>
                )}
            </div>
        </section>
    );
}
