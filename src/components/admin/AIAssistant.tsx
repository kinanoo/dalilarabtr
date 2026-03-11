'use client';

import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Send, Bot, User, Loader2, Trash2, X, Sparkles, Eraser, Brain } from 'lucide-react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';

// ── Types ──
interface Message {
  role: 'user' | 'assistant';
  content: string;
  _context?: string;
}

interface PendingAction {
  id: string;
  type: 'delete' | 'update';
  contentType: string;
  contentId: string;
  table: string;
  summary: string;
}

// ── Quick commands ──
const QUICK_COMMANDS = [
  { label: 'إحصائيات', prompt: 'أعطني نظرة عامة شاملة على الموقع — كل الإحصائيات والمعلّقات' },
  { label: 'المقالات', prompt: 'كم مقال في كل قسم؟' },
  { label: 'الأخبار', prompt: 'كم خبر حالياً في شريط الأخبار بالصفحة الرئيسية؟ اعرضها' },
  { label: 'تعليقات معلقة', prompt: 'اعرض التعليقات المعلقة بانتظار الموافقة' },
  { label: 'سجل النشاط', prompt: 'اعرض آخر 10 أحداث في سجل النشاط' },
  { label: 'الزيارات', prompt: 'اعرض إحصائيات الزيارات لهذا الأسبوع — أكثر الصفحات زيارة' },
  { label: 'الإعدادات', prompt: 'اعرض كل إعدادات الموقع الحالية' },
  { label: 'البانر', prompt: 'هل يوجد بانر نشط حالياً؟ اعرض تفاصيله' },
];

// ── Markdown-like renderer for AI responses ──
function renderMarkdown(text: string) {
  const lines = text.split('\n');
  const elements: React.ReactNode[] = [];
  let listItems: string[] = [];
  let listType: 'ul' | 'ol' | null = null;

  const flushList = () => {
    if (listItems.length === 0) return;
    const tag = listType === 'ol' ? 'ol' : 'ul';
    elements.push(
      tag === 'ol' ? (
        <ol key={`list-${elements.length}`} className="list-decimal list-inside space-y-1 my-2 text-sm">
          {listItems.map((item, i) => <li key={i}>{inlineFormat(item)}</li>)}
        </ol>
      ) : (
        <ul key={`list-${elements.length}`} className="list-disc list-inside space-y-1 my-2 text-sm">
          {listItems.map((item, i) => <li key={i}>{inlineFormat(item)}</li>)}
        </ul>
      )
    );
    listItems = [];
    listType = null;
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Heading ## or ###
    if (/^###?\s/.test(line)) {
      flushList();
      const content = line.replace(/^#{2,3}\s/, '');
      elements.push(
        <div key={`h-${i}`} className="font-bold text-sm mt-3 mb-1 text-blue-700 dark:text-blue-300">
          {inlineFormat(content)}
        </div>
      );
      continue;
    }

    // Unordered list: - item or * item
    const ulMatch = line.match(/^[\s]*[-*•]\s+(.*)/);
    if (ulMatch) {
      if (listType !== 'ul') flushList();
      listType = 'ul';
      listItems.push(ulMatch[1]);
      continue;
    }

    // Ordered list: 1. item or 1) item
    const olMatch = line.match(/^[\s]*\d+[.)]\s+(.*)/);
    if (olMatch) {
      if (listType !== 'ol') flushList();
      listType = 'ol';
      listItems.push(olMatch[1]);
      continue;
    }

    // Empty line
    if (!line.trim()) {
      flushList();
      elements.push(<div key={`br-${i}`} className="h-2" />);
      continue;
    }

    // Regular text
    flushList();
    elements.push(
      <p key={`p-${i}`} className="text-sm leading-relaxed my-0.5">
        {inlineFormat(line)}
      </p>
    );
  }
  flushList();

  return <>{elements}</>;
}

function inlineFormat(text: string): React.ReactNode {
  // Split by **bold** and `code`
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i} className="font-bold">{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith('`') && part.endsWith('`')) {
      return <code key={i} className="bg-slate-200 dark:bg-slate-700 px-1.5 py-0.5 rounded text-xs font-mono">{part.slice(1, -1)}</code>;
    }
    return part;
  });
}

// ── Main Component ──
export function AIAssistant({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);
  const [deepThink, setDeepThink] = useState(false);
  const [mounted, setMounted] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => { setMounted(true); }, []);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => { scrollToBottom(); }, [messages, scrollToBottom]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [isOpen]);

  // Escape to close
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  // Lock body scroll when open (mobile)
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = ''; };
    }
  }, [isOpen]);

  const sendMessage = async (text?: string) => {
    const messageText = text || input.trim();
    if (!messageText || loading) return;

    const userMessage: Message = { role: 'user', content: messageText };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');
    setLoading(true);
    setPendingAction(null);

    // Reset textarea height
    if (inputRef.current) inputRef.current.style.height = '44px';

    try {
      const res = await fetch('/api/admin/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMessages,
          ...(deepThink && { useDeepModel: true }),
        }),
      });

      const data = await res.json();

      if (data.reply) {
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: data.reply,
          ...(data._context && { _context: data._context }),
        }]);
      }

      if (data.action) {
        setPendingAction(data.action);
      }
    } catch {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'حدث خطأ في الاتصال. تأكد من اتصال الإنترنت وحاول مرة أخرى.',
      }]);
    } finally {
      setLoading(false);
    }
  };

  const confirmAction = async () => {
    if (!pendingAction) return;
    setLoading(true);

    try {
      const res = await fetch('/api/admin/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages,
          pendingAction: { ...pendingAction, confirmed: true },
        }),
      });

      const data = await res.json();
      setMessages(prev => [...prev, { role: 'assistant', content: data.reply || 'تمت العملية.' }]);
      setPendingAction(null);
    } catch {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'فشل تنفيذ العملية. حاول مرة أخرى.',
      }]);
    } finally {
      setLoading(false);
    }
  };

  const cancelAction = () => {
    setPendingAction(null);
    setMessages(prev => [...prev, { role: 'assistant', content: 'تم إلغاء العملية.' }]);
  };

  const clearChat = () => {
    setMessages([]);
    setPendingAction(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const showQuickCommands = messages.length === 0;

  const overlay = isOpen ? (
    <>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[200] bg-slate-900/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Chat Panel */}
      <motion.div
        initial={{ y: '100%', opacity: 0.5 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: '100%', opacity: 0 }}
        transition={{ type: 'spring', damping: 28, stiffness: 300 }}
        className="fixed inset-0 sm:inset-4 sm:top-8 sm:bottom-8 z-[201] flex flex-col bg-white dark:bg-slate-950 sm:rounded-3xl sm:max-w-2xl sm:mx-auto sm:shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-800 bg-gradient-to-l from-blue-600 to-indigo-700 text-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center">
              <Bot size={20} />
            </div>
            <div>
              <h2 className="font-bold text-sm">المساعد الذكي</h2>
              <p className="text-[11px] opacity-80">يفهم كل شيء عن الموقع</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {/* Deep Think toggle */}
            <button
              type="button"
              onClick={() => setDeepThink(!deepThink)}
              className={`p-2.5 rounded-full transition-colors ${deepThink ? 'bg-white/30 text-white' : 'text-white/60 hover:text-white hover:bg-white/10'}`}
              title={deepThink ? 'التفكير العميق مفعّل (نموذج أقوى)' : 'تفعيل التفكير العميق'}
            >
              <Brain size={18} />
            </button>
            {/* Clear chat */}
            {messages.length > 0 && (
              <button
                type="button"
                onClick={clearChat}
                className="p-2.5 rounded-full text-white/60 hover:text-white hover:bg-white/10 transition-colors"
                title="مسح المحادثة"
              >
                <Eraser size={18} />
              </button>
            )}
            {/* Close */}
            <button
              type="button"
              onClick={onClose}
              className="p-2.5 rounded-full text-white/80 hover:text-white hover:bg-white/10 transition-colors"
              title="إغلاق"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Deep think indicator */}
        <AnimatePresence>
          {deepThink && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="px-4 py-1.5 bg-purple-50 dark:bg-purple-950/30 text-purple-700 dark:text-purple-300 text-[11px] font-bold text-center flex items-center justify-center gap-1.5">
                <Brain size={12} />
                التفكير العميق مفعّل — نموذج أقوى للمهام المعقدة
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Messages area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
          {showQuickCommands && (
            <div className="flex flex-col items-center justify-center h-full text-center space-y-5">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
                <Sparkles size={32} className="text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-700 dark:text-slate-200 mb-1">كيف أقدر أساعدك؟</h3>
                <p className="text-slate-400 text-xs max-w-xs">
                  ابحث، أنشئ، عدّل، احذف — أي شيء تحتاجه في الموقع
                </p>
              </div>

              {/* Quick commands grid */}
              <div className="w-full max-w-sm grid grid-cols-2 gap-2">
                {QUICK_COMMANDS.map((cmd) => (
                  <button
                    type="button"
                    key={cmd.label}
                    onClick={() => sendMessage(cmd.prompt)}
                    className="px-3 py-2.5 text-xs font-bold bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-300 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-blue-400 dark:hover:border-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/30 hover:text-blue-600 dark:hover:text-blue-400 transition-all active:scale-95"
                  >
                    {cmd.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          <AnimatePresence initial={false}>
            {messages.map((msg, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className={`flex gap-2.5 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
              >
                {/* Avatar */}
                <div className={`shrink-0 w-7 h-7 rounded-full flex items-center justify-center mt-0.5 ${
                  msg.role === 'user'
                    ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600'
                    : 'bg-blue-100 dark:bg-blue-900/30 text-blue-600'
                }`}>
                  {msg.role === 'user' ? <User size={14} /> : <Bot size={14} />}
                </div>

                {/* Message bubble */}
                <div className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 ${
                  msg.role === 'user'
                    ? 'bg-emerald-600 text-white rounded-tr-sm'
                    : 'bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-200 rounded-tl-sm border border-slate-200 dark:border-slate-800'
                }`}>
                  {msg.role === 'user' ? (
                    <p className="text-sm leading-relaxed">{msg.content}</p>
                  ) : (
                    renderMarkdown(msg.content)
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Loading */}
          {loading && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex gap-2.5"
            >
              <div className="shrink-0 w-7 h-7 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 flex items-center justify-center">
                <Bot size={14} />
              </div>
              <div className="bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-2">
                <Loader2 size={14} className="animate-spin text-blue-500" />
                <span className="text-xs text-slate-400">
                  {deepThink ? 'يفكر بعمق...' : 'جاري المعالجة...'}
                </span>
              </div>
            </motion.div>
          )}

          {/* Pending action */}
          {pendingAction && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className={`mx-auto max-w-sm border rounded-2xl p-4 space-y-3 ${
                pendingAction.type === 'delete'
                  ? 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800'
                  : 'bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800'
              }`}
            >
              <div className={`flex items-center gap-2 font-bold text-sm ${
                pendingAction.type === 'delete' ? 'text-red-600 dark:text-red-400' : 'text-amber-600 dark:text-amber-400'
              }`}>
                <Trash2 size={16} />
                <span>{pendingAction.type === 'delete' ? 'تأكيد الحذف' : 'تأكيد التعديل'}</span>
              </div>
              <p className={`text-sm ${
                pendingAction.type === 'delete' ? 'text-red-700 dark:text-red-300' : 'text-amber-700 dark:text-amber-300'
              }`}>{pendingAction.summary}</p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={confirmAction}
                  disabled={loading}
                  className={`flex-1 min-h-[44px] px-4 py-2 text-white text-sm font-bold rounded-xl transition-colors disabled:opacity-50 active:scale-95 ${
                    pendingAction.type === 'delete' ? 'bg-red-600 hover:bg-red-700' : 'bg-amber-600 hover:bg-amber-700'
                  }`}
                >
                  {loading ? 'جاري التنفيذ...' : pendingAction.type === 'delete' ? 'نعم، احذف' : 'نعم، عدّل'}
                </button>
                <button
                  type="button"
                  onClick={cancelAction}
                  disabled={loading}
                  title="إلغاء"
                  className="min-h-[44px] min-w-[44px] flex items-center justify-center bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors active:scale-95"
                >
                  <X size={18} />
                </button>
              </div>
            </motion.div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick commands (scrollable) when messages exist */}
        {messages.length > 0 && !loading && (
          <div className="shrink-0 px-3 py-1.5 border-t border-slate-100 dark:border-slate-800/50 overflow-x-auto scrollbar-hide">
            <div className="flex gap-1.5 w-max">
              {QUICK_COMMANDS.map((cmd) => (
                <button
                  type="button"
                  key={cmd.label}
                  onClick={() => sendMessage(cmd.prompt)}
                  className="px-2.5 py-1 text-[11px] font-medium whitespace-nowrap bg-slate-50 dark:bg-slate-900 text-slate-500 dark:text-slate-400 rounded-full border border-slate-200 dark:border-slate-800 hover:border-blue-400 hover:text-blue-600 transition-colors active:scale-95"
                >
                  {cmd.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input area — safe-area aware */}
        <div className="shrink-0 border-t border-slate-200 dark:border-slate-800 p-3 bg-white dark:bg-slate-950" style={{ paddingBottom: 'max(12px, env(safe-area-inset-bottom))' }}>
          <div className="flex gap-2 items-end">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="اكتب أمراً... مثال: أنشئ مقال عن الإقامة السياحية"
              rows={1}
              disabled={loading}
              className="flex-1 resize-none rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-4 py-3 text-sm text-slate-700 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 transition-all"
              style={{ minHeight: '44px', maxHeight: '120px' }}
              onInput={(e) => {
                const target = e.target as HTMLTextAreaElement;
                target.style.height = '44px';
                target.style.height = `${Math.min(target.scrollHeight, 120)}px`;
              }}
            />
            <button
              type="button"
              onClick={() => sendMessage()}
              disabled={!input.trim() || loading}
              title="إرسال"
              className="shrink-0 w-11 h-11 rounded-xl bg-blue-600 text-white flex items-center justify-center hover:bg-blue-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed active:scale-95"
            >
              <Send size={18} className="rotate-180" />
            </button>
          </div>
        </div>
      </motion.div>
    </>
  ) : null;

  if (!mounted) return null;
  return createPortal(<AnimatePresence>{overlay}</AnimatePresence>, document.body);
}

// ── FAB Button (used in admin layout) ──
export function AIFab({ onClick }: { onClick: () => void }) {
  return (
    <motion.button
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', delay: 0.5 }}
      onClick={onClick}
      className="fixed bottom-6 left-6 z-[150] w-14 h-14 rounded-full bg-gradient-to-br from-blue-600 to-indigo-700 text-white shadow-xl shadow-blue-600/30 flex items-center justify-center hover:shadow-2xl hover:shadow-blue-600/40 hover:scale-105 active:scale-95 transition-all"
      title="المساعد الذكي"
    >
      <Bot size={24} />
      {/* Pulse ring */}
      <span className="absolute inset-0 rounded-full bg-blue-500/30 animate-ping" style={{ animationDuration: '3s' }} />
    </motion.button>
  );
}
