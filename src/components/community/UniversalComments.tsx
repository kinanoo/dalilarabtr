'use client';

import { useState, useEffect } from 'react';
import { MessageSquare, AlertTriangle, Send, CheckCircle2, Lock, ThumbsUp, Reply, ChevronDown, ChevronUp, Pencil, Trash2, X } from 'lucide-react';
import { fetchComments, postComment, toggleCommentLike, updateComment, deleteComment, type Comment } from '@/lib/api/comments';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabaseClient';

interface UniversalCommentsProps {
    entityType: 'article' | 'service' | 'update' | 'scenario' | 'zone';
    entityId: string;
    title?: string;
    className?: string;
}

function getOrCreateAnonId(): string {
    const key = 'anon_comment_id';
    let id = localStorage.getItem(key);
    if (!id || id.length < 8) {
        id = crypto.randomUUID().slice(0, 8);
        localStorage.setItem(key, id);
    }
    return id;
}

function getLikedSet(userKey: string): Set<string> {
    try {
        const raw = localStorage.getItem(`liked_comments_${userKey}`);
        return raw ? new Set(JSON.parse(raw)) : new Set();
    } catch {
        return new Set();
    }
}

function saveLikedSet(userKey: string, liked: Set<string>) {
    localStorage.setItem(`liked_comments_${userKey}`, JSON.stringify([...liked]));
}

// ─── Single Comment ───────────────────────────────────────────────────────────
function CommentItem({
    comment,
    userKey,
    visitorId,
    userName,
    currentUserId,
    activeReplyId,
    onReply,
    onCancelReply,
    onSubmitReply,
    onEdit,
    onDelete,
    submittingReply,
    depth = 0,
}: {
    comment: Comment;
    userKey: string;
    visitorId: string;
    userName: string;
    currentUserId: string | null;
    activeReplyId: string | null;
    onReply: (id: string) => void;
    onCancelReply: () => void;
    onSubmitReply: (parentId: string, content: string) => Promise<void>;
    onEdit: (commentId: string, newContent: string) => Promise<void>;
    onDelete: (commentId: string) => Promise<void>;
    submittingReply: boolean;
    depth?: number;
}) {
    const [likes, setLikes] = useState(comment.likes_count);
    const [liked, setLiked] = useState(false);
    const [showReplies, setShowReplies] = useState(true);
    const [replyText, setReplyText] = useState('');
    const [editing, setEditing] = useState(false);
    const [editText, setEditText] = useState(comment.content);
    const [editSubmitting, setEditSubmitting] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [deleteSubmitting, setDeleteSubmitting] = useState(false);

    const isOwner = currentUserId && comment.user_id === currentUserId;

    const isReplyActive = activeReplyId === comment.id;
    const replyCount = comment.replies?.length || 0;

    useEffect(() => {
        setLiked(getLikedSet(userKey).has(comment.id));
    }, [userKey, comment.id]);

    const handleLike = async () => {
        const wasLiked = liked;
        // Optimistic update
        setLiked(!wasLiked);
        setLikes((prev) => prev + (wasLiked ? -1 : 1));
        const likedSet = getLikedSet(userKey);
        if (wasLiked) {
            likedSet.delete(comment.id);
        } else {
            likedSet.add(comment.id);
        }
        saveLikedSet(userKey, likedSet);

        const { liked: serverLiked, error } = await toggleCommentLike(comment.id, visitorId);
        if (error) {
            // Revert on error
            setLiked(wasLiked);
            setLikes((prev) => prev + (wasLiked ? 1 : -1));
            const ls2 = getLikedSet(userKey);
            if (wasLiked) {
                ls2.add(comment.id);
            } else {
                ls2.delete(comment.id);
            }
            saveLikedSet(userKey, ls2);
        }
    };

    const handleReplySubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!replyText.trim()) return;
        await onSubmitReply(comment.id, replyText);
        setReplyText('');
    };

    const handleEditSubmit = async () => {
        if (!editText.trim() || editSubmitting) return;
        setEditSubmitting(true);
        await onEdit(comment.id, editText.trim());
        setEditSubmitting(false);
        setEditing(false);
    };

    const handleDeleteConfirm = async () => {
        setDeleteSubmitting(true);
        await onDelete(comment.id);
        setDeleteSubmitting(false);
        setShowDeleteConfirm(false);
    };

    return (
        <div className={depth > 0 ? 'mr-6 border-r-2 border-slate-100 dark:border-slate-700 pr-4' : ''}>
            {/* Comment Card */}
            <div className={`p-4 rounded-2xl ${
                comment.is_official
                    ? 'bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-200 dark:border-emerald-900/40'
                    : 'bg-slate-50 dark:bg-slate-800/60'
            }`}>
                {/* Header */}
                <div className="flex items-center gap-2 mb-2">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${
                        comment.is_official
                            ? 'bg-emerald-200 dark:bg-emerald-800 text-emerald-800 dark:text-emerald-100'
                            : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                    }`}>
                        {comment.is_official ? <CheckCircle2 size={14} /> : comment.author_name.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="font-bold text-slate-900 dark:text-white text-sm leading-none mb-0.5">
                            {comment.author_name}
                        </p>
                        <div className="flex items-center gap-1.5 flex-wrap">
                            {comment.is_official && (
                                <span className="text-[10px] bg-emerald-200 dark:bg-emerald-800 text-emerald-800 dark:text-emerald-100 px-1.5 py-0.5 rounded font-bold">
                                    رد رسمي
                                </span>
                            )}
                            {comment.is_correction && (
                                <span className="text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded font-bold flex items-center gap-0.5">
                                    <AlertTriangle size={9} /> تصحيح
                                </span>
                            )}
                            <span className="text-xs text-slate-400">
                                {new Date(comment.created_at).toLocaleDateString('ar-EG')}
                            </span>
                        </div>
                    </div>

                    {/* Edit/Delete for owner */}
                    {isOwner && !editing && (
                        <div className="flex items-center gap-1 shrink-0">
                            <button
                                onClick={() => { setEditing(true); setEditText(comment.content); }}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 dark:hover:text-blue-400 transition-colors"
                                title="تعديل"
                            >
                                <Pencil size={13} />
                            </button>
                            <button
                                onClick={() => setShowDeleteConfirm(true)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 dark:hover:text-red-400 transition-colors"
                                title="حذف"
                            >
                                <Trash2 size={13} />
                            </button>
                        </div>
                    )}
                </div>

                {/* Content — normal or editing */}
                {editing ? (
                    <div className="pr-10 mb-3">
                        <textarea
                            value={editText}
                            onChange={(e) => setEditText(e.target.value)}
                            className="w-full bg-white dark:bg-slate-900 border border-blue-300 dark:border-blue-700 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                            rows={3}
                            autoFocus
                        />
                        <div className="flex items-center gap-2 mt-2">
                            <button
                                onClick={handleEditSubmit}
                                disabled={editSubmitting || !editText.trim()}
                                className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white font-bold px-4 py-1.5 rounded-lg text-xs transition-all flex items-center gap-1"
                            >
                                {editSubmitting ? '...' : <><Pencil size={12} /> حفظ</>}
                            </button>
                            <button
                                onClick={() => setEditing(false)}
                                className="text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 font-bold px-3 py-1.5 rounded-lg text-xs transition-colors"
                            >
                                إلغاء
                            </button>
                        </div>
                    </div>
                ) : (
                    <p className="text-slate-700 dark:text-slate-300 text-sm leading-relaxed mb-3 pr-10">
                        {comment.content}
                    </p>
                )}

                {/* Delete Confirmation */}
                {showDeleteConfirm && (
                    <div className="pr-10 mb-3 p-3 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/30 rounded-xl animate-in fade-in duration-200">
                        <p className="text-xs font-bold text-red-700 dark:text-red-300 mb-2">هل تريد حذف هذا التعليق نهائياً؟</p>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={handleDeleteConfirm}
                                disabled={deleteSubmitting}
                                className="bg-red-600 hover:bg-red-700 disabled:bg-slate-300 text-white font-bold px-4 py-1.5 rounded-lg text-xs transition-all"
                            >
                                {deleteSubmitting ? '...' : 'نعم، احذف'}
                            </button>
                            <button
                                onClick={() => setShowDeleteConfirm(false)}
                                className="text-slate-500 hover:text-slate-700 font-bold px-3 py-1.5 rounded-lg text-xs transition-colors"
                            >
                                إلغاء
                            </button>
                        </div>
                    </div>
                )}

                {/* Action Buttons */}
                <div className="flex items-center gap-2 pr-10">
                    <button
                        onClick={handleLike}
                        className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full transition-all ${
                            liked
                                ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/20 dark:hover:text-red-400'
                                : 'bg-slate-100 dark:bg-slate-700 text-slate-500 hover:bg-emerald-50 hover:text-emerald-600 dark:hover:bg-emerald-900/20 dark:hover:text-emerald-400'
                        }`}
                    >
                        <ThumbsUp size={13} className={liked ? 'fill-emerald-500' : ''} />
                        {likes > 0 ? likes : 'إعجاب'}
                    </button>

                    {depth === 0 && (
                        <button
                            onClick={() => (isReplyActive ? onCancelReply() : onReply(comment.id))}
                            className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full transition-all ${
                                isReplyActive
                                    ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                                    : 'bg-slate-100 dark:bg-slate-700 text-slate-500 hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-900/20 dark:hover:text-blue-400'
                            }`}
                        >
                            <Reply size={13} />
                            {isReplyActive ? 'إلغاء' : 'رد'}
                        </button>
                    )}

                    {replyCount > 0 && depth === 0 && (
                        <button
                            onClick={() => setShowReplies(!showReplies)}
                            className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 mr-auto transition-colors"
                        >
                            {showReplies ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                            {replyCount} {replyCount === 1 ? 'رد' : 'ردود'}
                        </button>
                    )}
                </div>
            </div>

            {/* Inline Reply Form */}
            {isReplyActive && depth === 0 && (
                <form
                    onSubmit={handleReplySubmit}
                    className="mt-2 mr-6 flex items-center gap-2 bg-slate-50 dark:bg-slate-800/80 p-3 rounded-xl border border-slate-200 dark:border-slate-700"
                >
                    <div className="w-7 h-7 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center shrink-0 text-xs font-bold text-emerald-700 dark:text-emerald-400">
                        {userName.charAt(0)}
                    </div>
                    <input
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm outline-none focus:border-emerald-500 dark:focus:border-emerald-500 transition-colors"
                        placeholder={`رد على ${comment.author_name}...`}
                        required
                        autoFocus
                    />
                    <button
                        type="submit"
                        disabled={submittingReply}
                        className="bg-emerald-600 text-white px-4 py-2 rounded-lg text-xs font-bold hover:bg-emerald-700 disabled:opacity-50 flex items-center gap-1 shrink-0 transition-colors"
                    >
                        {submittingReply ? '...' : <><Send size={12} /> إرسال</>}
                    </button>
                </form>
            )}

            {/* Nested Replies */}
            {depth === 0 && showReplies && replyCount > 0 && (
                <div className="mt-2 space-y-2">
                    {comment.replies!.map((reply) => (
                        <CommentItem
                            key={reply.id}
                            comment={reply}
                            userKey={userKey}
                            visitorId={visitorId}
                            userName={userName}
                            currentUserId={currentUserId}
                            activeReplyId={activeReplyId}
                            onReply={onReply}
                            onCancelReply={onCancelReply}
                            onSubmitReply={onSubmitReply}
                            onEdit={onEdit}
                            onDelete={onDelete}
                            submittingReply={submittingReply}
                            depth={1}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function UniversalComments({ entityType, entityId, title = 'التعليقات', className }: UniversalCommentsProps) {
    const [comments, setComments] = useState<Comment[]>([]);
    const [loading, setLoading] = useState(true);
    const [userKey, setUserKey] = useState('anon');
    const [visitorId, setVisitorId] = useState('');

    const [currentUserId, setCurrentUserId] = useState<string | null>(null);
    const [name, setName] = useState('');
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [content, setContent] = useState('');
    const [isCorrection, setIsCorrection] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const [activeReplyId, setActiveReplyId] = useState<string | null>(null);
    const [submittingReply, setSubmittingReply] = useState(false);

    useEffect(() => {
        loadComments();
        resolveUserName();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [entityId]);

    // Listen for external comment additions (e.g. from InlineStarRating)
    useEffect(() => {
        const handler = () => loadComments();
        window.addEventListener('comments-updated', handler);
        return () => window.removeEventListener('comments-updated', handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [entityId]);

    const resolveUserName = async () => {
        if (!supabase) return;
        const { data: { user } } = await supabase.auth.getUser();

        if (user) {
            const { data: profile } = await supabase
                .from('member_profiles')
                .select('full_name')
                .eq('id', user.id)
                .single();
            const displayName = profile?.full_name || user.user_metadata?.full_name || user.email?.split('@')[0] || 'عضو';
            setName(displayName);
            setIsLoggedIn(true);
            setUserKey(user.id);
            setVisitorId(user.id);
            setCurrentUserId(user.id);
        } else {
            const anonId = getOrCreateAnonId();
            setName(`مجهول #${anonId}`);
            setIsLoggedIn(false);
            setUserKey(`anon_${anonId}`);
            // Persistent visitor ID — shared with AnalyticsTracker ('visitor_id' key)
            let vid = localStorage.getItem('visitor_id') || '';
            if (!vid) {
                vid = crypto.randomUUID();
                localStorage.setItem('visitor_id', vid);
            }
            setVisitorId(vid);
        }
    };

    const loadComments = async () => {
        setLoading(true);
        try {
            const { data, error } = await fetchComments(entityType, entityId);
            if (error) console.error('[Comments] fetch error:', error, { entityType, entityId });
            if (data) setComments(data);
        } catch (err) {
            console.error('[Comments] unexpected error:', err);
        }
        setLoading(false);
    };

    const handleSubmitReply = async (parentId: string, replyContent: string) => {
        setSubmittingReply(true);
        const { data: newReply, error } = await postComment({
            entity_type: entityType,
            entity_id: entityId,
            author_name: name.trim() || 'مجهول',
            content: replyContent,
            parent_id: parentId,
            user_id: currentUserId || undefined,
        });
        setSubmittingReply(false);

        if (error) {
            toast.error(`خطأ: ${(error as any).message || 'فشل الإرسال'}`);
            return;
        }

        toast.success('تم نشر ردك!');
        setActiveReplyId(null);

        // Reply notification now handled by DB trigger (notify_on_new_comment)

        const replyObj: Comment = {
            id: newReply?.id || crypto.randomUUID(),
            entity_type: entityType,
            entity_id: entityId,
            author_name: name.trim() || 'مجهول',
            content: replyContent,
            is_correction: false,
            is_official: false,
            status: 'approved',
            created_at: new Date().toISOString(),
            parent_id: parentId,
            user_id: currentUserId,
            likes_count: 0,
            replies: [],
        };

        setComments((prev) =>
            prev.map((c) => c.id === parentId ? { ...c, replies: [...(c.replies || []), replyObj] } : c)
        );
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!content.trim()) return;

        setSubmitting(true);
        const { data: newData, error } = await postComment({
            entity_type: entityType,
            entity_id: entityId,
            author_name: name.trim() || 'مجهول',
            content: content,
            is_correction: isCorrection,
            user_id: currentUserId || undefined,
        });
        setSubmitting(false);

        if (error) {
            toast.error(`خطأ: ${(error as any).message || 'فشل الإرسال'}`);
            return;
        }

        toast.success('تم نشر تعليقك بنجاح!');
        const newComment: Comment = {
            id: newData?.id || crypto.randomUUID(),
            entity_type: entityType,
            entity_id: entityId,
            author_name: name.trim() || 'مجهول',
            content: content,
            is_correction: isCorrection,
            is_official: false,
            status: 'approved',
            created_at: new Date().toISOString(),
            user_id: currentUserId,
            likes_count: 0,
            replies: [],
        };
        setComments((prev) => [newComment, ...prev]);
        setContent('');
        setIsCorrection(false);

        // Reload from server after a short delay to confirm persistence
        setTimeout(() => loadComments(), 1500);
    };

    const handleEditComment = async (commentId: string, newContent: string) => {
        const { success: ok } = await updateComment(commentId, newContent);
        if (!ok) {
            toast.error('فشل تعديل التعليق');
            return;
        }
        toast.success('تم تعديل التعليق');
        // Update in state (root or reply)
        setComments(prev => prev.map(c => {
            if (c.id === commentId) return { ...c, content: newContent };
            if (c.replies?.length) {
                return { ...c, replies: c.replies.map(r => r.id === commentId ? { ...r, content: newContent } : r) };
            }
            return c;
        }));
    };

    const handleDeleteComment = async (commentId: string) => {
        const { success: ok } = await deleteComment(commentId);
        if (!ok) {
            toast.error('فشل حذف التعليق');
            return;
        }
        toast.success('تم حذف التعليق');
        // Remove from state (root or reply)
        setComments(prev => {
            // Try removing as root
            const filtered = prev.filter(c => c.id !== commentId);
            if (filtered.length < prev.length) return filtered;
            // Try removing as reply
            return prev.map(c => ({
                ...c,
                replies: c.replies?.filter(r => r.id !== commentId) || [],
            }));
        });
    };

    const totalCount = comments.reduce((sum, c) => sum + 1 + (c.replies?.length || 0), 0);

    return (
        <section className={`bg-white dark:bg-slate-800 rounded-2xl p-6 md:p-8 shadow-sm border border-slate-100 dark:border-slate-700 ${className}`}>
            {/* Header */}
            <div className="flex items-center gap-3 mb-8">
                <div className="p-3 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 rounded-xl">
                    <MessageSquare size={24} />
                </div>
                <div>
                    <h3 className="text-xl font-bold text-slate-800 dark:text-white">{title}</h3>
                    <p className="text-slate-500 text-sm">
                        {totalCount > 0 ? `${totalCount} مشاركة` : 'شاركنا رأيك أو صحح معلوماتنا'}
                    </p>
                </div>
            </div>

            {/* Comments List */}
            <div className="space-y-4 mb-10">
                {loading ? (
                    <div className="text-center py-4 text-slate-400">جاري التحميل...</div>
                ) : comments.length === 0 ? (
                    <div className="text-center py-8 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">
                        <p className="text-slate-500 text-sm">كن أول من يشارك في هذا الموضوع!</p>
                    </div>
                ) : (
                    comments.map((c) => (
                        <CommentItem
                            key={c.id}
                            comment={c}
                            userKey={userKey}
                            visitorId={visitorId}
                            userName={name}
                            currentUserId={currentUserId}
                            activeReplyId={activeReplyId}
                            onReply={setActiveReplyId}
                            onCancelReply={() => setActiveReplyId(null)}
                            onSubmitReply={handleSubmitReply}
                            onEdit={handleEditComment}
                            onDelete={handleDeleteComment}
                            submittingReply={submittingReply}
                        />
                    ))
                )}
            </div>

            {/* Post Form */}
            <form
                onSubmit={handleSubmit}
                className="bg-slate-50 dark:bg-slate-950 p-1 rounded-2xl border border-slate-200 dark:border-slate-800 focus-within:ring-2 focus-within:ring-emerald-500 transition-all"
            >
                <textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    className="w-full bg-transparent p-4 min-h-[100px] outline-none text-slate-800 dark:text-slate-100 placeholder:text-slate-400 resize-none rounded-t-xl"
                    placeholder="اكتب تعليقك هنا..."
                    required
                />

                <div className="bg-white dark:bg-slate-900 p-3 rounded-b-xl border-t border-slate-200 dark:border-slate-800 flex flex-wrap gap-3 items-center justify-between">
                    <div className="flex items-center gap-2 flex-1 min-w-[200px]">
                        {isLoggedIn ? (
                            <div className="flex items-center gap-2 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 px-3 py-2 rounded-lg text-sm text-emerald-700 dark:text-emerald-300 font-bold flex-1">
                                <Lock size={13} />
                                {name}
                            </div>
                        ) : (
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="bg-slate-100 dark:bg-slate-800 px-3 py-2 rounded-lg text-sm outline-none border border-transparent focus:border-emerald-500 w-full"
                                placeholder="الاسم (اختياري)"
                            />
                        )}
                    </div>

                    <div className="flex items-center gap-4">
                        <label className="flex items-center gap-2 cursor-pointer group">
                            <input
                                type="checkbox"
                                checked={isCorrection}
                                onChange={(e) => setIsCorrection(e.target.checked)}
                                className="w-4 h-4 rounded text-amber-500 focus:ring-amber-500 border-slate-300"
                            />
                            <span className="text-xs font-bold text-slate-500 group-hover:text-amber-600 transition-colors flex items-center gap-1">
                                <AlertTriangle size={12} className={isCorrection ? 'text-amber-500' : ''} />
                                هل هذا تصحيح؟
                            </span>
                        </label>

                        <button
                            type="submit"
                            disabled={submitting}
                            className="bg-emerald-600 text-white px-6 py-2 rounded-lg font-bold text-sm hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
                        >
                            {submitting ? 'جاري الإرسال...' : <><Send size={16} /> إرسال</>}
                        </button>
                    </div>
                </div>
            </form>
        </section>
    );
}
