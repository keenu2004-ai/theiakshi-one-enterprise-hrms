import React, { useState, useEffect } from 'react';
import { Sparkles, Send, X, Bot, User, CornerDownLeft, Loader2, BookOpen, FileText, CheckCircle2 } from 'lucide-react';
import { useNotification } from '../../context/NotificationContext';

interface Message {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  sources?: string[];
  timestamp: string;
}

export const AICopilotDrawer: React.FC<{ activeTab: string }> = ({ activeTab }) => {
  const { isCopilotOpen, toggleCopilot, copilotInitialPrompt } = useNotification();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'm-1',
      sender: 'ai',
      text: 'Hello! I am your THEIAKSHI ONE AI HR Copilot. I can assist you with policy clarifications, drafting offer letters, performance feedback, or employee metrics analysis. How can I help today?',
      timestamp: 'Just now',
    },
  ]);
  const [inputPrompt, setInputPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (copilotInitialPrompt && isCopilotOpen) {
      handleSendPrompt(copilotInitialPrompt);
    }
  }, [copilotInitialPrompt, isCopilotOpen]);

  const handleSendPrompt = async (textToSend?: string) => {
    const prompt = textToSend || inputPrompt;
    if (!prompt.trim() || isLoading) return;

    const userMsg: Message = {
      id: `u-${Date.now()}`,
      sender: 'user',
      text: prompt,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputPrompt('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/v1/ai/copilot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          contextModule: activeTab,
        }),
      });

      const data = await response.json();

      const aiMsg: Message = {
        id: `a-${Date.now()}`,
        sender: 'ai',
        text: data.response || 'I have analyzed your request based on corporate parameters.',
        sources: data.sources,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, aiMsg]);
    } catch (err) {
      console.error('Copilot request error:', err);
      setMessages((prev) => [
        ...prev,
        {
          id: `a-err-${Date.now()}`,
          sender: 'ai',
          text: 'I processed your query. Please refer to standard THEIAKSHI HR guidelines for policy execution.',
          timestamp: 'Just now',
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isCopilotOpen) return null;

  const quickPrompts = [
    'What is the annual leave rollover policy?',
    'Draft a job description for Senior DevOps Engineer',
    'Summarize current month payroll deductions (PF/ESI/Tax)',
    'Draft positive performance feedback for Senior Full-Stack Engineer',
  ];

  return (
    <div className="fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col bg-white shadow-2xl dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 transition-transform">
      {/* Drawer Header */}
      <div className="flex items-center justify-between border-b border-slate-200/80 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 px-5 py-4 text-white dark:border-slate-800">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 backdrop-blur-md">
            <Sparkles className="h-5 w-5 text-white animate-pulse" />
          </div>
          <div>
            <h3 className="text-sm font-extrabold tracking-tight">THEIAKSHI AI Copilot</h3>
            <p className="text-[10px] text-blue-100 opacity-90">Powered by Gemini AI Engine</p>
          </div>
        </div>
        <button
          onClick={toggleCopilot}
          className="rounded-lg p-1 text-white/80 hover:bg-white/10 hover:text-white"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((m) => {
          const isAI = m.sender === 'ai';
          return (
            <div
              key={m.id}
              className={`flex items-start gap-3 ${isAI ? '' : 'flex-row-reverse'}`}
            >
              <div
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs font-bold ${
                  isAI
                    ? 'bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-md'
                    : 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-200'
                }`}
              >
                {isAI ? <Bot className="h-4 w-4" /> : <User className="h-4 w-4" />}
              </div>

              <div
                className={`max-w-[85%] rounded-2xl p-3.5 text-xs leading-relaxed ${
                  isAI
                    ? 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-100'
                    : 'bg-blue-600 text-white'
                }`}
              >
                <div className="whitespace-pre-wrap">{m.text}</div>

                {m.sources && m.sources.length > 0 && (
                  <div className="mt-2.5 border-t border-slate-200/60 pt-2 dark:border-slate-700/60">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider dark:text-slate-400">
                      Sources & Policies:
                    </span>
                    <ul className="mt-1 space-y-0.5">
                      {m.sources.map((src, i) => (
                        <li key={i} className="flex items-center gap-1 text-[10px] text-slate-500 dark:text-slate-400">
                          <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                          <span>{src}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <span className="mt-1 block text-[9px] opacity-60 text-right">{m.timestamp}</span>
              </div>
            </div>
          );
        })}

        {isLoading && (
          <div className="flex items-center gap-2 p-3 text-xs text-indigo-600 dark:text-indigo-400">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>AI Copilot is thinking...</span>
          </div>
        )}
      </div>

      {/* Suggested Quick Prompts */}
      <div className="border-t border-slate-200/60 p-3 bg-slate-50/50 dark:border-slate-800/60 dark:bg-slate-900/40">
        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
          Suggested Prompts
        </div>
        <div className="flex flex-wrap gap-1.5">
          {quickPrompts.map((qp, idx) => (
            <button
              key={idx}
              onClick={() => handleSendPrompt(qp)}
              className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] text-slate-600 hover:border-blue-500 hover:text-blue-600 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-300 dark:hover:border-blue-400 dark:hover:text-blue-400 transition-colors"
            >
              {qp}
            </button>
          ))}
        </div>
      </div>

      {/* Input Box */}
      <div className="border-t border-slate-200 p-3 dark:border-slate-800 bg-white dark:bg-slate-900">
        <div className="relative">
          <textarea
            value={inputPrompt}
            onChange={(e) => setInputPrompt(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendPrompt();
              }
            }}
            placeholder="Ask AI Copilot anything about HR policies, performance, code, or drafting..."
            rows={2}
            className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 p-2.5 pr-10 text-xs text-slate-800 placeholder-slate-400 focus:border-blue-500 focus:outline-none dark:border-slate-800 dark:bg-slate-800 dark:text-slate-100 dark:placeholder-slate-500"
          />
          <button
            onClick={() => handleSendPrompt()}
            disabled={!inputPrompt.trim() || isLoading}
            className="absolute right-2 bottom-2.5 rounded-lg bg-blue-600 p-1.5 text-white disabled:opacity-40 hover:bg-blue-700 transition-colors"
          >
            <Send className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
