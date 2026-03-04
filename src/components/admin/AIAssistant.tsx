'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Send, Bot, User, Loader2, Trash2, X, Sparkles } from 'lucide-react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  _context?: string; // tool execution context for Gemini memory
}

interface PendingAction {
  id: string;
  type: 'delete' | 'update';
  contentType: string;
  contentId: string;
  table: string;
  summary: string;
}

const QUICK_COMMANDS = [
  { label: 'إحصائيات شاملة', prompt: 'أعطني نظرة عامة شاملة على الموقع — كل الإحصائيات والمعلّقات' },
  { label: 'المقالات حسب القسم', prompt: 'كم مقال في كل قسم؟' },
  { label: 'شريط الأخبار', prompt: 'كم خبر حالياً في شريط الأخبار بالصفحة الرئيسية؟ اعرضها' },
  { label: 'تعليقات بانتظار', prompt: 'اعرض التعليقات المعلقة بانتظار الموافقة' },
  { label: 'سجل النشاط', prompt: 'اعرض آخر 10 أحداث في سجل النشاط' },
  { label: 'تحليل الزيارات', prompt: 'اعرض إحصائيات الزيارات لهذا الأسبوع — أكثر الصفحات زيارة' },
  { label: 'إعدادات الموقع', prompt: 'اعرض كل إعدادات الموقع الحالية' },
  { label: 'البانر العلوي', prompt: 'هل يوجد بانر نشط حالياً؟ اعرض تفاصيله' },
];

export function AIAssistant() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const sendMessage = async (text?: string) => {
    const messageText = text || input.trim();
    if (!messageText || loading) return;

    const userMessage: Message = { role: 'user', content: messageText };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');
    setLoading(true);
    setPendingAction(null); // Clear any pending action when sending new message

    try {
      const res = await fetch('/api/admin/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newMessages }),
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

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="flex flex-col bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-lg overflow-hidden" style={{ height: 'calc(100vh - 220px)', minHeight: '500px' }}>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center space-y-6">
            <div className="w-20 h-20 rounded-full bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center">
              <Sparkles size={40} className="text-blue-500" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-700 dark:text-slate-200 mb-2">مرحباً! أنا المساعد الذكي</h3>
              <p className="text-slate-400 text-sm max-w-md">
                اكتب أمراً بالعربي لإدارة محتوى الموقع — بحث، إنشاء، تعديل، حذف، نشر.
              </p>
            </div>

            {/* Quick commands */}
            <div className="flex flex-wrap gap-2 justify-center max-w-lg">
              {QUICK_COMMANDS.map((cmd) => (
                <button
                  key={cmd.label}
                  onClick={() => sendMessage(cmd.prompt)}
                  className="px-3 py-1.5 text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-full hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:text-blue-600 transition-colors"
                >
                  {cmd.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
            {/* Avatar */}
            <div className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${msg.role === 'user'
              ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600'
              : 'bg-blue-100 dark:bg-blue-900/30 text-blue-600'
              }`}>
              {msg.role === 'user' ? <User size={16} /> : <Bot size={16} />}
            </div>

            {/* Message bubble */}
            <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${msg.role === 'user'
              ? 'bg-emerald-600 text-white rounded-tr-sm'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-tl-sm'
              }`}>
              {msg.content}
            </div>
          </div>
        ))}

        {/* Loading indicator */}
        {loading && (
          <div className="flex gap-3">
            <div className="shrink-0 w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 flex items-center justify-center">
              <Bot size={16} />
            </div>
            <div className="bg-slate-100 dark:bg-slate-800 rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-2 text-slate-400">
              <Loader2 size={16} className="animate-spin" />
              <span className="text-sm">جاري المعالجة...</span>
            </div>
          </div>
        )}

        {/* Pending action confirmation */}
        {pendingAction && (
          <div className={`mx-auto max-w-md border rounded-xl p-4 space-y-3 ${
            pendingAction.type === 'delete'
              ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
              : 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800'
          }`}>
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
                onClick={confirmAction}
                disabled={loading}
                className={`flex-1 px-4 py-2 text-white text-sm font-bold rounded-lg transition-colors disabled:opacity-50 ${
                  pendingAction.type === 'delete' ? 'bg-red-600 hover:bg-red-700' : 'bg-amber-600 hover:bg-amber-700'
                }`}
              >
                {loading ? 'جاري التنفيذ...' : pendingAction.type === 'delete' ? 'تأكيد الحذف' : 'تأكيد التعديل'}
              </button>
              <button
                onClick={cancelAction}
                disabled={loading}
                className="px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-sm rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
              >
                <X size={16} />
              </button>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div className="border-t border-slate-200 dark:border-slate-800 p-3 sm:p-4">
        {messages.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {QUICK_COMMANDS.map((cmd) => (
              <button
                key={cmd.label}
                onClick={() => sendMessage(cmd.prompt)}
                disabled={loading}
                className="px-2.5 py-1 text-[11px] font-medium bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-full hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:text-blue-600 transition-colors disabled:opacity-50"
              >
                {cmd.label}
              </button>
            ))}
          </div>
        )}

        <div className="flex gap-2 items-end">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="اكتب أمراً... مثال: ابحث عن مقالات الإقامة"
            rows={1}
            disabled={loading}
            className="flex-1 resize-none rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-4 py-3 text-sm text-slate-700 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 transition-all"
            style={{ minHeight: '44px', maxHeight: '120px' }}
            onInput={(e) => {
              const target = e.target as HTMLTextAreaElement;
              target.style.height = '44px';
              target.style.height = `${Math.min(target.scrollHeight, 120)}px`;
            }}
          />
          <button
            onClick={() => sendMessage()}
            disabled={!input.trim() || loading}
            className="shrink-0 w-11 h-11 rounded-xl bg-blue-600 text-white flex items-center justify-center hover:bg-blue-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Send size={18} className="rotate-180" />
          </button>
        </div>
      </div>
    </div>
  );
}
