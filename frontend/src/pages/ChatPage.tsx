import { useState, useRef, useEffect } from 'react';
import { apiClient } from '@/services/api';
import { Send, Sparkles, MessageCircle, Loader, RotateCcw } from 'lucide-react';
import Spinner from '@/components/ui/Spinner';
import Textarea from '@/components/ui/Textarea';
import clsx from 'clsx';
import logoUrl from '@/assets/logo.png';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: string;
  metadata?: any;
}

export default function ChatPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [stage, setStage] = useState('GREETING');
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load today's standup session on mount
  useEffect(() => {
    const loadSession = async () => {
      try {
        setLoadingHistory(true);
        const response = await apiClient.getChatSession();
        if (response.data.success && response.data.data) {
          setStage(response.data.data.stage);
          // Session exists, we're ready for conversation
          if (response.data.data.history && response.data.data.history.length > 0) {
            setMessages(response.data.data.history.map((msg: any) => ({
              id: msg.id,
              role: msg.role as 'user' | 'assistant',
              content: msg.content,
              createdAt: msg.createdAt,
            })));
          }
        }
      } catch (error) {
        console.error('Error loading session:', error);
      } finally {
        setLoadingHistory(false);
      }
    };
    loadSession();
  }, []);

  const handleSendMessageWithText = async (text: string) => {
    if (loading) return;

    setLoading(true);
    try {
      // Add user message to conversation
      const userMsg = {
        id: Math.random().toString(),
        role: 'user' as const,
        content: text,
        createdAt: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, userMsg]);

      const response = await apiClient.sendChatMessage(text);
      if (response.data.success && response.data.data) {
        const { aiResponse, stage: nextStage } = response.data.data;
        if (nextStage) {
          setStage(nextStage);
        }

        const aiMsg = {
          id: Math.random().toString(),
          role: 'assistant' as const,
          content: aiResponse,
          createdAt: new Date().toISOString(),
        };

        setMessages((prev) => [...prev, aiMsg]);
      }
    } catch (error: any) {
      console.error('Error sending message:', error);
      // Error toast is handled by API client interceptor
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage = input;
    setInput('');
    await handleSendMessageWithText(userMessage);
  };

  if (loadingHistory) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <Spinner size="lg" />
          <p className="text-on-surface-dark mt-md">Loading today's chat...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full relative bg-transparent">
      {/* Header */}
      <div className="border-b border-white/5 px-lg py-md flex items-center justify-between z-10 sticky top-0 backdrop-blur-xl bg-[#020617]/60">
        <div className="flex items-center gap-md">
          <div className="p-sm bg-gradient-to-br from-primary-500 to-indigo-600 rounded-full shadow-lg shadow-primary-500/20">
            <MessageCircle className="text-white" size={20} />
          </div>
          <div>
            <h2 className="text-title-md font-semibold text-white font-inter tracking-tight">
              Daily AI Chat
            </h2>
            <p className="text-body-sm text-white/50">
              {messages.length > 0 ? `${messages.length} messages today` : 'Start your first update'}
            </p>
          </div>
        </div>
      </div>

      {/* Messages container */}
      <div className="flex-1 overflow-y-auto p-lg space-y-lg">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center max-w-sm">
              <div className="mx-auto mb-lg flex items-center justify-center">
                <img src={logoUrl} alt="Logo" className="w-24 h-24 object-contain drop-shadow-2xl opacity-90" />
              </div>
              <h3 className="text-headline-md font-semibold text-white mb-md font-inter tracking-tight">
                Welcome Back! 👋
              </h3>
              <p className="text-body-md text-outline leading-relaxed">
                Share what you've accomplished today, challenges you're facing, or anything on your mind. I'm here to help track and organize your progress!
              </p>
              <div className="mt-lg pt-lg border-t border-outline-dark">
                <p className="text-label-md text-outline font-geist">✨ Tip: Be specific about tasks and time spent for better insights</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-md">
            {/* Date indicator */}
            <div className="flex items-center justify-center gap-md my-md opacity-50">
              <div className="flex-1 h-px bg-outline-dark/50"></div>
              <span className="text-label-md text-outline font-geist">Today</span>
              <div className="flex-1 h-px bg-outline-dark/50"></div>
            </div>

            {messages.map((msg) => (
              <div
                key={msg.id}
                className={clsx(
                  'flex animate-in fade-in slide-in-from-bottom-2 duration-300',
                  msg.role === 'user' ? 'justify-end' : 'justify-start'
                )}
              >
                <div
                  className={clsx(
                    'py-md px-lg max-w-[85%] md:max-w-[75%] break-words',
                    'transition-all duration-300 hover:shadow-xl',
                    msg.role === 'user'
                      ? 'bg-gradient-to-br from-primary-500 to-indigo-600 text-white rounded-3xl rounded-br-sm shadow-primary-500/20 shadow-lg border border-primary-400/20'
                      : 'bg-slate-800/60 backdrop-blur-md text-white rounded-3xl rounded-tl-sm border border-white/10 shadow-lg'
                  )}
                >
                  {msg.role === 'assistant' && (
                    <div className="text-primary-300 text-xs font-semibold flex items-center gap-xs mb-md uppercase tracking-wider">
                      <Sparkles size={14} />
                      AI Assistant
                    </div>
                  )}
                  <div className="text-[15px] leading-relaxed whitespace-pre-wrap font-inter">
                    {msg.content}
                  </div>
                  <div className="text-[11px] font-geist opacity-50 mt-sm text-right">
                    {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex justify-start animate-in fade-in slide-in-from-bottom-2 duration-500">
                <div className="bg-slate-800/60 backdrop-blur-md text-white rounded-3xl rounded-tl-sm border border-white/10 py-md px-lg shadow-lg">
                  <div className="flex items-center gap-md">
                    <Loader className="animate-spin text-primary-400" size={18} />
                    <span className="text-[15px] font-medium text-white/80">AI is analyzing your update...</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Suggestion Chips */}
      {!loading && (
        <div className="flex flex-wrap items-center justify-center gap-xs mb-sm px-lg animate-in fade-in duration-300">
          {(stage === 'WAITING_FOR_WORK' || stage === 'WAITING_FOR_ANOTHER_TASK') && (
            <>
              {['Worked on bug fixes', 'Design UX', 'Client presentation', 'Developed a new feature', 'Code review', 'Testing & bug fixes'].map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => handleSendMessageWithText(suggestion)}
                  className="px-4 py-1.5 bg-slate-800/60 hover:bg-slate-700/80 active:bg-slate-700 border border-white/10 text-white/85 hover:text-white text-body-sm font-medium rounded-full transition-all duration-150 cursor-pointer whitespace-nowrap shadow-sm hover:scale-105 active:scale-95"
                >
                  {suggestion}
                </button>
              ))}
            </>
          )}

          {stage === 'WAITING_FOR_MORE_TASKS' && (
            <>
              {['Yes', 'No'].map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => handleSendMessageWithText(suggestion)}
                  className="px-4 py-1.5 bg-slate-800/60 hover:bg-slate-700/80 active:bg-slate-700 border border-white/10 text-white/85 hover:text-white text-body-sm font-medium rounded-full transition-all duration-150 cursor-pointer whitespace-nowrap shadow-sm hover:scale-105 active:scale-95"
                >
                  {suggestion}
                </button>
              ))}
            </>
          )}

          {stage === 'WAITING_FOR_HOURS' && (
            <>
              {['8', '7', '6', '4'].map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => handleSendMessageWithText(suggestion)}
                  className="px-4 py-1.5 bg-slate-800/60 hover:bg-slate-700/80 active:bg-slate-700 border border-white/10 text-white/85 hover:text-white text-body-sm font-medium rounded-full transition-all duration-150 cursor-pointer whitespace-nowrap shadow-sm hover:scale-105 active:scale-95"
                >
                  {suggestion} hours
                </button>
              ))}
            </>
          )}

          {stage === 'COMPLETED' && (
            <button
              onClick={() => setShowConfirmModal(true)}
              className="flex items-center gap-xs px-5 py-2 bg-slate-800/80 hover:bg-slate-700/80 border border-white/10 text-primary-400 font-semibold text-body-sm rounded-full transition-all hover:scale-105 active:scale-95 shadow-lg"
            >
              <RotateCcw size={13} />
              Update the status
            </button>
          )}
        </div>
      )}

      {/* Input form */}
      <div className="p-lg z-10 pb-xl">
        <div className="bg-slate-800/40 backdrop-blur-2xl max-w-4xl mx-auto rounded-3xl p-sm shadow-[0_8px_32px_rgba(0,0,0,0.4)] border border-white/10 transition-all focus-within:border-primary-500/50 focus-within:bg-slate-800/60">
          <form onSubmit={handleSendMessage} className="flex gap-sm items-end pl-md">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage(e as any);
                }
              }}
              placeholder="Message AI Assistant..."
              rows={1}
              disabled={loading}
              className="flex-1 resize-none bg-transparent border-none focus:ring-0 p-0 text-[15px] text-white placeholder-white/40 mb-sm"
            />
            <button
              type="submit"
              disabled={!input.trim() || loading}
              className={clsx(
                'bg-gradient-to-br from-primary-500 to-indigo-600 hover:from-primary-400 hover:to-indigo-500',
                'disabled:from-white/10 disabled:to-white/10 disabled:text-white/30 disabled:cursor-not-allowed disabled:shadow-none',
                'text-white w-10 h-10 rounded-full transition-all duration-300 shadow-lg shadow-primary-500/20 hover:shadow-primary-500/40 hover:scale-105 active:scale-95',
                'flex items-center justify-center flex-shrink-0',
                'focus:outline-none focus:ring-2 focus:ring-primary-400 focus:ring-offset-2 focus:ring-offset-[#020617]'
              )}
              title="Send message (Enter)"
            >
              {loading ? (
                <Spinner size="sm" />
              ) : (
                <Send size={18} className="ml-1" />
              )}
            </button>
          </form>
          <p className="text-center text-xs text-white/40 font-geist mt-sm mb-xs">
            Enter to send • Shift+Enter for new line
          </p>
        </div>
      </div>

      {/* Custom Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-[#020617]/75 backdrop-blur-md flex items-center justify-center z-50 p-md animate-in fade-in duration-200">
          <div className="bg-slate-900/90 border border-white/10 p-lg rounded-3xl max-w-sm w-full shadow-2xl flex flex-col items-center text-center animate-in zoom-in-95 duration-200">
            <div className="w-12 h-12 bg-primary-500/20 rounded-full flex items-center justify-center text-primary-400 mb-md border border-primary-500/30">
              <RotateCcw size={22} className="animate-pulse" />
            </div>
            <h3 className="text-title-lg font-semibold text-white font-inter mb-sm">
              Update Today's Status?
            </h3>
            <p className="text-body-md text-white/60 font-inter mb-lg leading-relaxed">
              Are you sure you want to update today's status? This will reset the conversation and let you re-record your standup.
            </p>
            <div className="flex gap-sm w-full">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="flex-1 px-md py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 text-white/80 hover:text-white font-medium text-body-sm rounded-xl transition-all duration-150 active:scale-95"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  setShowConfirmModal(false);
                  try {
                    await apiClient.resetChatSession();
                    // Re-fetch the session to display the new seeded greeting immediately
                    const response = await apiClient.getChatSession();
                    if (response.data.success && response.data.data) {
                      setStage(response.data.data.stage);
                      if (response.data.data.history) {
                        setMessages(response.data.data.history.map((msg: any) => ({
                          id: msg.id,
                          role: msg.role as 'user' | 'assistant',
                          content: msg.content,
                          createdAt: msg.createdAt,
                        })));
                      }
                    } else {
                      setMessages([]);
                      setStage('GREETING');
                    }
                  } catch (err) {
                    console.error("Failed to reset session:", err);
                  }
                }}
                className="flex-1 px-md py-2.5 bg-gradient-to-br from-primary-500 to-indigo-600 hover:from-primary-400 hover:to-indigo-500 text-white font-semibold text-body-sm rounded-xl shadow-lg shadow-primary-500/20 transition-all duration-150 hover:scale-105 active:scale-95"
              >
                Update
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
