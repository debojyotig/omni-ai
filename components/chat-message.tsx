/**
 * Chat Message Component
 *
 * Renders individual messages with:
 * - Avatar (user/assistant)
 * - Markdown formatting
 * - Code syntax highlighting
 */

'use client';

import * as React from 'react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import remarkGfm from 'remark-gfm';
import { User, Bot } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

interface ChatMessageProps {
  role: 'user' | 'assistant';
  content: string;
  isStreaming?: boolean;
}

export function ChatMessage({ role, content, isStreaming = false }: ChatMessageProps) {
  const isUser = role === 'user';

  return (
    <div
      className={cn(
        'flex gap-3 p-4 rounded-lg',
        isUser ? 'justify-end' : 'justify-start'
      )}
    >
      {!isUser && (
        <Avatar className="h-8 w-8 shrink-0">
          <AvatarFallback className="bg-primary/10">
            <Bot className="h-4 w-4" />
          </AvatarFallback>
        </Avatar>
      )}

      <div
        className={cn(
          'flex-1 space-y-2 rounded-lg px-4 py-2 max-w-[80%]',
          isUser
            ? 'bg-primary text-primary-foreground ml-auto'
            : 'bg-muted'
        )}
      >
        {isUser ? (
          // Simple rendering for user messages
          <p className="whitespace-pre-wrap text-sm">{content}</p>
        ) : (
          // Rich markdown rendering for assistant messages
          <div className="prose prose-sm dark:prose-invert max-w-none">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                code(props) {
                  const { node, inline, className, children, ...rest } = props as any;
                  const match = /language-(\w+)/.exec(className || '');
                  const language = match ? match[1] : '';

                  return !inline && language ? (
                    <SyntaxHighlighter
                      {...rest}
                      style={vscDarkPlus}
                      language={language}
                      PreTag="div"
                      className="rounded-md !mt-2 !mb-2"
                    >
                      {String(children).replace(/\n$/, '')}
                    </SyntaxHighlighter>
                  ) : (
                    <code
                      className={cn(
                        'relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-xs',
                        className
                      )}
                      {...rest}
                    >
                      {children}
                    </code>
                  );
                },
                pre({ children }) {
                  return <>{children}</>;
                },
                p({ children }) {
                  return <p className="mb-2 last:mb-0">{children}</p>;
                },
                ul({ children }) {
                  return <ul className="my-2 ml-6 list-disc">{children}</ul>;
                },
                ol({ children }) {
                  return <ol className="my-2 ml-6 list-decimal">{children}</ol>;
                },
                li({ children }) {
                  return <li className="mt-1">{children}</li>;
                },
                h1({ children }) {
                  return <h1 className="mt-4 mb-2 text-xl font-bold">{children}</h1>;
                },
                h2({ children }) {
                  return <h2 className="mt-3 mb-2 text-lg font-semibold">{children}</h2>;
                },
                h3({ children }) {
                  return <h3 className="mt-3 mb-2 text-base font-semibold">{children}</h3>;
                },
                blockquote({ children }) {
                  return (
                    <blockquote className="mt-2 border-l-2 border-primary pl-4 italic">
                      {children}
                    </blockquote>
                  );
                },
                a({ href, children }) {
                  return (
                    <a
                      href={href}
                      className="text-primary underline underline-offset-4 hover:text-primary/80"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {children}
                    </a>
                  );
                },
              }}
            >
              {content}
            </ReactMarkdown>
            {isStreaming && (
              <span className="inline-block w-2 h-4 ml-1 bg-foreground/50 animate-pulse" />
            )}
          </div>
        )}
      </div>

      {isUser && (
        <Avatar className="h-8 w-8 shrink-0">
          <AvatarFallback className="bg-primary/10">
            <User className="h-4 w-4" />
          </AvatarFallback>
        </Avatar>
      )}
    </div>
  );
}
