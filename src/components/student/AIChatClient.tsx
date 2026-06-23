'use client';

import { useState, useRef, useEffect } from 'react';
import type { TeachingMode } from '@/types';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface Props {
  student: { id: string; full_name: string; age: number; school_level: string; preferred_language: string };
  levels: Array<{ subject_id: string; current_age_level: number; target_age_level: number; subjects?: { id: string; name: string; icon: string } }>;
  subjects: Array<{ id: string; name: string; icon: string; code: string }>;
}

const TEACHING_MODES: { value: TeachingMode; label: string; emoji: string }[] = [
  { value: 'normal', label: 'Normal', emoji: '💬' },
  { value: 'eli5', label: 'Explain like I\'m 5', emoji: '👶' },
  { value: 'visual', label: 'Visual', emoji: '👁️' },
  { value: 'story', label: 'Story mode', emoji: '📖' },
  { value: 'exam_focused', label: 'Exam focus', emoji: '📝' },
];

export default function AIChatClient({ student, levels, subjects }: Props) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: `Hi ${student.full_name.split(' ')[0]}! 👋 I'm your AI teacher. What would you like to learn today? You can ask me anything about any subject — I'll explain it at your level!`,
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [teachingMode, setTeachingMode] = useState<TeachingMode>('normal');
  const [showModePanel, setShowModePanel] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function sendMessage() {
    if (!input.trim() || loading) return;
    const userMessage = input.trim();
    setInput('');

    const userMsg: Message = { role: 'user', content: userMessage, timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setLoading(true);

    try {
      const selectedLevel = levels.find(l => l.subject_id === selectedSubjectId);
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMsg].map(m => ({ role: m.role, content: m.content })),
          studentAge: student.age,
          schoolLevel: student.school_level,
          currentAgeLevel: selectedLevel?.current_age_level || student.age,
          targetAgeLevel: selectedLevel?.target_age_level || student.age,
          subjectName: subjects.find(s => s.id === selectedSubjectId)?.name || 'General',
          teachingMode,
          preferredLanguage: student.preferred_language,
          studentName: student.full_name,
        }),
      });

      if (!res.ok) throw new Error('Failed');
      const data = await res.json();

      setMessages(prev => [...prev, {
        role: 'assistant',
        content: data.message,
        timestamp: new Date(),
      }]);
    } catch {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Sorry, I had trouble responding. Please try again! 😊',
        timestamp: new Date(),
      }]);
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  const quickPrompts = [
    'Explain this step by step',
    'Give me a practice question',
    'I don\'t understand. Can you use a simpler example?',
    'What are the common mistakes in this topic?',
    'How is this used in real life?',
  ];

  return (
    <div className="flex flex-col h-screen md:h-auto md:min-h-screen bg-white">
      {/* Header */}
      <div className="border-b border-gray-100 px-4 py-3 flex items-center gap-3 bg-white sticky top-0 z-10">
        <div className="w-10 h-10 bg-gradient-to-br from-primary-600 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
          🤖
        </div>
        <div className="flex-1">
          <div className="font-semibold text-gray-900">AI Teacher</div>
          <div className="text-xs text-green-500 font-medium">● Online — ready to teach</div>
        </div>
        <div className="flex items-center gap-2">
          {/* Subject selector */}
          <select
            value={selectedSubjectId}
            onChange={e => setSelectedSubjectId(e.target.value)}
            className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 text-gray-700 bg-white"
          >
            <option value="">All subjects</option>
            {subjects.map(s => (
              <option key={s.id} value={s.id}>{s.icon} {s.name}</option>
            ))}
          </select>
          {/* Mode selector */}
          <button
            onClick={() => setShowModePanel(!showModePanel)}
            className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 text-gray-700 bg-white"
          >
            {TEACHING_MODES.find(m => m.value === teachingMode)?.emoji} Mode
          </button>
        </div>
      </div>

      {/* Mode Panel */}
      {showModePanel && (
        <div className="bg-gray-50 border-b border-gray-100 px-4 py-3">
          <p className="text-xs font-medium text-gray-500 mb-2">Teaching Mode:</p>
          <div className="flex flex-wrap gap-2">
            {TEACHING_MODES.map(mode => (
              <button
                key={mode.value}
                onClick={() => { setTeachingMode(mode.value); setShowModePanel(false); }}
                className={`text-xs px-3 py-1.5 rounded-full border transition-all ${
                  teachingMode === mode.value
                    ? 'bg-primary-600 text-white border-primary-600'
                    : 'border-gray-200 text-gray-700 hover:border-primary-300'
                }`}
              >
                {mode.emoji} {mode.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {msg.role === 'assistant' && (
              <div className="w-8 h-8 bg-gradient-to-br from-primary-600 to-purple-600 rounded-full flex items-center justify-center text-white text-sm mr-2 flex-shrink-0 mt-0.5">
                🤖
              </div>
            )}
            <div className={msg.role === 'user' ? 'chat-bubble-user' : 'chat-bubble-ai'}>
              <div className="whitespace-pre-wrap text-sm leading-relaxed">{msg.content}</div>
              <div className={`text-xs mt-1 ${msg.role === 'user' ? 'text-primary-200' : 'text-gray-400'}`}>
                {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="w-8 h-8 bg-gradient-to-br from-primary-600 to-purple-600 rounded-full flex items-center justify-center text-white text-sm mr-2">🤖</div>
            <div className="chat-bubble-ai">
              <div className="flex gap-1 py-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Prompts */}
      <div className="px-4 py-2 border-t border-gray-50 overflow-x-auto">
        <div className="flex gap-2 min-w-max">
          {quickPrompts.map((prompt, i) => (
            <button
              key={i}
              onClick={() => { setInput(prompt); inputRef.current?.focus(); }}
              className="text-xs px-3 py-1.5 bg-gray-100 hover:bg-primary-50 hover:text-primary-700 rounded-full text-gray-600 whitespace-nowrap transition-colors"
            >
              {prompt}
            </button>
          ))}
        </div>
      </div>

      {/* Input */}
      <div className="px-4 py-3 border-t border-gray-100 bg-white">
        <div className="flex items-end gap-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask your AI teacher anything..."
            rows={1}
            className="flex-1 input-field resize-none min-h-[44px] max-h-32"
            style={{ height: 'auto' }}
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim() || loading}
            className="w-11 h-11 bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white rounded-xl flex items-center justify-center flex-shrink-0 transition-colors"
          >
            <svg className="w-5 h-5 rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </div>
        <p className="text-xs text-gray-400 mt-1.5 text-center">Press Enter to send • Shift+Enter for new line</p>
      </div>
    </div>
  );
}
