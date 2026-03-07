"use client";

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';

interface Message {
  id: string;
  sender_id: string;
  body: string;
  created_at: string;
  is_deleted: boolean;
}

interface ChatWindowProps {
  threadId: string;
  userId: string;
  otherUser: { id: string; username: string | null; avatar_url: string | null };
  initialMessages: Message[];
}

export function ChatWindow({ threadId, userId, otherUser, initialMessages }: ChatWindowProps) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();

  // Scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Subscribe to real-time messages
  useEffect(() => {
    const channel = supabase
      .channel(`dm:${threadId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `channel_id=eq.${threadId}`,
        },
        (payload) => {
          const newMsg = payload.new as Message;
          setMessages((prev) => {
            if (prev.some((m) => m.id === newMsg.id)) return prev;
            return [...prev, newMsg];
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [threadId, supabase]);

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || sending) return;
    setSending(true);

    const res = await fetch('/api/messages/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ threadId, body: input.trim() }),
    });

    if (res.ok) {
      setInput('');
    }
    setSending(false);
  }

  return (
    <div className="flex flex-col h-[calc(100vh-12rem)]">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-surface-200 pb-3 mb-3">
        <Link href="/messages" className="text-sm text-brand hover:underline">
          ← Back
        </Link>
        <div className="h-8 w-8 rounded-full bg-surface-200 flex items-center justify-center text-xs font-bold text-ink-muted">
          {otherUser.username?.[0]?.toUpperCase() ?? '?'}
        </div>
        <Link href={`/profile/${otherUser.username}`} className="font-semibold text-sm hover:text-brand">
          {otherUser.username ?? 'Unknown'}
        </Link>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-2 pr-2">
        {messages.length === 0 && (
          <p className="text-center text-sm text-ink-muted py-8">
            No messages yet. Say hello!
          </p>
        )}
        {messages.map((msg) => {
          const isMine = msg.sender_id === userId;
          return (
            <div
              key={msg.id}
              className={cn('flex', isMine ? 'justify-end' : 'justify-start')}
            >
              <div
                className={cn(
                  'max-w-[70%] rounded-lg px-3 py-2 text-sm',
                  isMine
                    ? 'bg-brand text-white rounded-br-sm'
                    : 'bg-surface-100 text-ink rounded-bl-sm'
                )}
              >
                <p>{msg.is_deleted ? 'Message deleted' : msg.body}</p>
                <p className={cn('text-[10px] mt-0.5', isMine ? 'text-white/60' : 'text-ink-light')}>
                  {new Date(msg.created_at).toLocaleTimeString('en-KE', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form onSubmit={sendMessage} className="mt-3 flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type a message..."
          className="flex-1 rounded-lg border border-surface-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30"
          maxLength={2000}
        />
        <button
          type="submit"
          disabled={sending || !input.trim()}
          className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-600 transition-colors disabled:opacity-50"
        >
          Send
        </button>
      </form>
    </div>
  );
}
